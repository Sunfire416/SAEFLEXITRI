import React, { useState, useEffect, useContext } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Card,
  Typography,
  Box,
  Grid,
  Autocomplete,
  Container,
  Paper,
  Snackbar,
} from "@mui/material";
import { QRCodeSVG } from "qrcode.react";
import { debounce } from "lodash";
import AirplanemodeActiveIcon from "@mui/icons-material/AirplanemodeActive";
import TrainIcon from "@mui/icons-material/Train";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useQrCode } from "../../context/QrCodeContext";
import airlineLogo from "../../assets/images/airline-logo.jpg";
import MapboxMap from "./MapboxMap";
import "./BoardingPassGenerator.css";

// Types de transport avec icônes
const transportTypes = [
  { value: "avion", label: "Avion", price: 300, icon: <AirplanemodeActiveIcon /> },
  { value: "train", label: "Train", price: 150, icon: <TrainIcon /> },
  { value: "bus", label: "Bus", price: 50, icon: <DirectionsBusIcon /> },
];

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

const BoardingPassGenerator = () => {
  const [step, setStep] = useState(1);
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedTransportType, setSelectedTransportType] = useState("");
  const [needTaxiToAirport, setNeedTaxiToAirport] = useState(false);
  const [needTaxiToDestination, setNeedTaxiToDestination] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [generatedQRCode, setGeneratedQRCode] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { user } = useContext(AuthContext);
  const { qrCodes, setQrCodes } = useQrCode();

  // Calculer le prix total
  const calculatePrice = () => {
    const transportPrice = transportTypes.find((type) => type.value === selectedTransportType)?.price || 0;
    let price = transportPrice;
    if (needTaxiToAirport) price += 50;
    if (needTaxiToDestination) price += 50;
    setTotalPrice(price);
  };

  useEffect(() => {
    calculatePrice();
  }, [selectedTransportType, needTaxiToAirport, needTaxiToDestination]);

  // Récupérer les suggestions de villes
  const fetchCitySuggestions = debounce(async (query) => {
    if (query.length < 3) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setCitySuggestions(data.map((item) => item.display_name));
    } catch (error) {
      console.error("Erreur lors de la récupération des suggestions de villes :", error);
    }
  }, 300);

  // Passer à l'étape suivante
  const handleNextStep = () => {
    if (step === 1 && (!departure.trim() || !destination.trim())) {
      setSnackbarMessage("Veuillez entrer une adresse de départ et de destination.");
      setSnackbarOpen(true);
      return;
    }
    if (step < 7) {
      setStep((prevStep) => prevStep + 1);
    }
  };

  // Revenir à l'étape précédente
  const handlePreviousStep = () => {
    if (step > 1) {
      setStep((prevStep) => prevStep - 1);
    }
  };

  // Formater les données pour l'API
  const formatTripDataForAPI = (qrData, userId) => {
    return {
      id_pmr: userId, // Identifiant du PMR
      id_accompagnant: null, // Mettre null au lieu de 1 pour éviter l'erreur UUID
      prix_total: qrData.totalPrice, // Prix total du voyage
      bagage: [
        {
          id: 1,
          poid: "10", // Poids en kg (string)
          descriptif: "rouge", // Description du bagage
        },
      ],
      etapes: [
        {
          type: qrData.transportType, // Type de transport (avion, train, bus)
          id: qrData.transportType === "avion" ? "FL12345" : qrData.transportType === "train" ? "TGV123" : "BUS456", // ID de l'étape
          adresse_1: qrData.departure, // Adresse de départ
          adresse_2: qrData.destination, // Adresse de destination
          departure_time: new Date().toISOString(), // Heure de départ
          arrival_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // Heure d'arrivée (exemple: 2 heures plus tard)
        },
      ],
    };
  };

  // Enregistrer le voyage dans l'API
  const saveTripToAPI = async (tripData) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setSnackbarMessage("❌ Erreur: Utilisateur non authentifié.");
      setSnackbarOpen(true);
      return null;
    }

    if (!user?.user_id) {
      setSnackbarMessage("❌ Erreur: ID utilisateur non trouvé.");
      setSnackbarOpen(true);
      return null;
    }

    let endpoint;
    let payload;

    if (tripData.transportType === "train") {
      // Utiliser l'endpoint générique pour les trains aussi (migré vers Supabase)
      endpoint = `${API_URL}/voyages/insert`; // ou /voyages (alias supporté)
      // On utilise le même format de payload que pour les autres
      // Mais on s'assure que le type est bien 'train' dans les étapes
      payload = formatTripDataForAPI(tripData, user.user_id);
    } else {
      // Utiliser l'endpoint générique pour les autres types de transport
      endpoint = `${API_URL}/voyages/insert`;
      payload = formatTripDataForAPI(tripData, user.user_id);
    }

    try {
      const response = await axios.post(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Réponse de l'API :", response.data); // Afficher la réponse de l'API

      if (response.status === 201) {
        setSnackbarMessage("✅ Voyage enregistré avec succès !");
        setSnackbarOpen(true);
        return response.data;
      } else {
        throw new Error(`Erreur lors de l'enregistrement du voyage. Statut : ${response.status}`);
      }
    } catch (error) {
      console.error("Erreur voyage:", error);
      setSnackbarMessage(
        `❌ Erreur lors de l'enregistrement du voyage. Détails : ${error.message}`
      );
      setSnackbarOpen(true);
      return null;
    }
  };

  // Générer le QR code et enregistrer le voyage
  const generateQRCodes = async () => {
    const qrData = {
      departure,
      destination,
      transportType: selectedTransportType || "",
      needTaxiToAirport,
      needTaxiToDestination,
      totalPrice,
    };

    const voyageData = await saveTripToAPI(qrData);

    if (!voyageData) {
      return;
    }

    const qrString = JSON.stringify({ ...qrData, id_voyage: voyageData.id_voyage });
    setGeneratedQRCode(qrString);
    setQrCodes([...qrCodes, qrString]);
  };

  // Gérer le paiement
  const handlePayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setTransactionStatus("❌ Erreur: Utilisateur non authentifié.");
      return;
    }

    if (!user?.user_id) {
      setTransactionStatus("❌ Erreur: ID utilisateur non trouvé.");
      return;
    }

    if (totalPrice <= 0) {
      setTransactionStatus("❌ Erreur: Montant invalide.");
      return;
    }

    // Vérifier que l'utilisateur a suffisamment de solde
    const userBalance = user.solde || 0;
    if (userBalance < totalPrice) {
      setTransactionStatus(`❌ Erreur: Solde insuffisant. Vous avez ${userBalance}€, besoin de ${totalPrice}€`);
      return;
    }

    const paymentData = {
      sender: user.user_id, // Pas besoin de .toString()
      receiver: "2462094f-0ed6-4cb0-946a-427d615c008f", // ID de l'admin
      amount: totalPrice,
      description: `Paiement pour voyage ${selectedTransportType} de ${departure} à ${destination}`
    };

    try {
      console.log("Envoi du paiement:", paymentData);
      const response = await axios.post(
        `${API_URL}/transactions/pay`,
        paymentData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setTransactionStatus("✅ Paiement réussi !");
        // Mettre à jour le solde localement
        user.solde = response.data.transaction.sender.new_balance;
        setSnackbarMessage("✅ Paiement effectué avec succès !");
        setSnackbarOpen(true);
      } else {
        setTransactionStatus(`❌ Erreur: ${response.data.error}`);
      }
    } catch (error) {
      console.error("Erreur lors du paiement :", error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message;
      setTransactionStatus(`❌ Erreur: ${errorMsg}`);
      setSnackbarMessage(`❌ Erreur de paiement: ${errorMsg}`);
      setSnackbarOpen(true);
    }
  };


  // Fermer le Snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Afficher le contenu de l'étape
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Box>
            <img src={airlineLogo} alt="Airline Logo" style={{ width: "150px", marginBottom: "20px" }} />
            <Autocomplete
              freeSolo
              options={citySuggestions}
              onInputChange={(event, value) => {
                fetchCitySuggestions(value);
                setDeparture(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Adresse de départ"
                  variant="outlined"
                  value={departure}
                  required
                  sx={{ mt: 4 }}
                />
              )}
            />
            <Autocomplete
              freeSolo
              options={citySuggestions}
              onInputChange={(event, value) => {
                fetchCitySuggestions(value);
                setDestination(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  label="Adresse de destination"
                  variant="outlined"
                  value={destination}
                  required
                  sx={{ mt: 4 }}
                />
              )}
            />
          </Box>
        );
      case 2:
        return (
          <FormControl fullWidth sx={{ mt: 6 }}>
            <InputLabel>Mode de Transport</InputLabel>
            <Select
              value={selectedTransportType || ""}
              onChange={(e) => setSelectedTransportType(e.target.value)}
              label="Mode de Transport"
            >
              {transportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {type.icon}
                    <Typography>{type.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 3:
        return (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h6">Options supplémentaires</Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
              <Button
                variant={needTaxiToAirport ? "contained" : "outlined"}
                onClick={() => setNeedTaxiToAirport(!needTaxiToAirport)}
              >
                Taxi vers l'aéroport (+50€)
              </Button>
              <Button
                variant={needTaxiToDestination ? "contained" : "outlined"}
                onClick={() => setNeedTaxiToDestination(!needTaxiToDestination)}
              >
                Taxi vers la destination (+50€)
              </Button>
            </Box>
          </Box>
        );
      case 4:
        return (
          <Typography variant="h4" sx={{ mt: 6 }}>
            Prix Total: {totalPrice}€
          </Typography>
        );
      case 5:
        return (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h4">Résumé de la commande</Typography>
            <Box sx={{ mt: 4, textAlign: "left" }}>
              <Typography><strong>Départ:</strong> {departure}</Typography>
              <Typography><strong>Destination:</strong> {destination}</Typography>
              <Typography><strong>Mode de transport:</strong> {selectedTransportType}</Typography>
              <Typography><strong>Taxi vers l'aéroport:</strong> {needTaxiToAirport ? "Oui" : "Non"}</Typography>
              <Typography><strong>Taxi vers la destination:</strong> {needTaxiToDestination ? "Oui" : "Non"}</Typography>
              <Typography><strong>Prix total:</strong> {totalPrice}€</Typography>
            </Box>
            <MapboxMap departure={departure} destination={destination} />
          </Box>
        );
      case 6:
        return (
          <Box sx={{ mt: 6 }}>
            <Button variant="contained" color="primary" onClick={generateQRCodes}>
              Générer QR Code
            </Button>
          </Box>
        );
      case 7:
        return (
          <Box sx={{ mt: 6 }}>
            {generatedQRCode && (
              <Card sx={{ p: 4, textAlign: "center" }}>
                <QRCodeSVG value={generatedQRCode} size={150} />
                <Typography sx={{ mt: 2 }}>{generatedQRCode}</Typography>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handlePayment}
                  sx={{ mt: 4 }}
                >
                  Payer maintenant
                </Button>
                {transactionStatus && (
                  <Typography sx={{ mt: 2, color: transactionStatus.includes("❌") ? "red" : "green" }}>
                    {transactionStatus}
                  </Typography>
                )}
              </Card>
            )}
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4, textAlign: "center" }}>
        <Typography variant="h3" sx={{ mb: 4 }}>
          Réservation
        </Typography>
        {renderStep()}
        <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
          {step > 1 && (
            <Grid item>
              <Button variant="outlined" onClick={handlePreviousStep} sx={{ px: 4 }}>
                Précédent
              </Button>
            </Grid>
          )}
          {step < 7 && (
            <Grid item>
              <Button variant="contained" onClick={handleNextStep} sx={{ px: 4 }}>
                Suivant
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default BoardingPassGenerator;