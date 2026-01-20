import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useBaggage } from "../../context/BaggageContext";
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function BaggageTracking() {
  const { baggageQrCodes, setBaggageQrCodes } = useBaggage();
  const [baggageWeight, setBaggageWeight] = useState("");
  const [baggageDescription, setBaggageDescription] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fonction pour générer et stocker un QR Code
  const generateBaggageQrCode = () => {
    if (!baggageWeight || !baggageDescription || !departure || !arrival) {
      setErrorMessage("Veuillez renseigner tous les champs");
      return;
    }

    const baggageData = {
      weight: baggageWeight,
      description: baggageDescription,
      departure,
      arrival,
      timestamp: Date.now()
    };

    const qrCodeData = JSON.stringify(baggageData);
    if (qrCodeData.length > 2953) {
      setErrorMessage("Les données sont trop volumineuses pour être encodées en QR Code.");
      return;
    }

    setBaggageQrCodes([...baggageQrCodes, qrCodeData]);
    setBaggageWeight("");
    setBaggageDescription("");
    setDeparture("");
    setArrival("");
    setSuccessMessage("QR Code généré et enregistré avec succès !");
  };

  // Fonction pour supprimer un QR Code spécifique
  const deleteBaggageQrCode = (index) => {
    setBaggageQrCodes((prevCodes) => prevCodes.filter((_, i) => i !== index));
  };

  // Fonction pour télécharger un QR Code en PDF
  const handleDownloadQR = async (qrData, index) => {
    try {
      const data = JSON.parse(qrData);
      const doc = new jsPDF();

      // Titre
      doc.setFontSize(16);
      doc.text('QR Code Bagage', 20, 20);

      // Contenu
      doc.setFontSize(11);
      let yPosition = 35;
      const lineHeight = 7;

      const fields = [
        { label: 'Poids', value: `${data.weight} kg` },
        { label: 'Description', value: data.description },
        { label: 'Départ', value: data.departure },
        { label: 'Arrivée', value: data.arrival }
      ];

      fields.forEach((field) => {
        doc.text(`${field.label}:`, 20, yPosition);
        doc.text(String(field.value), 60, yPosition);
        yPosition += lineHeight;
      });

      // QR Code
      const qrElement = document.getElementById(`baggage-qr-${index}`);
      if (qrElement) {
        yPosition += 5;
        const canvas = await html2canvas(qrElement);
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, yPosition, 50, 50);
      }

      doc.save(`bagage-${index + 1}.pdf`);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      setErrorMessage('Erreur lors du téléchargement du PDF');
    }
  };

  return (
    <Box sx={{ bgcolor: '#F7F9FB', width: '100%', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Inter", "Stem Extra Light", sans-serif',
              fontWeight: 600,
              color: '#393839',
              mb: 1
            }}
          >
            Gestion des Bagages
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(57, 56, 57, 0.7)',
              fontFamily: '"Inter", sans-serif'
            }}
          >
            Créez et gérez vos QR codes bagages pour un suivi optimal
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* COLONNE GAUCHE: Formulaire Création */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(57, 56, 57, 0.10)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                height: 'fit-content'
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <QrCodeIcon sx={{ color: '#2eb378', fontSize: 28 }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      color: '#393839'
                    }}
                  >
                    Créer un bagage
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Poids du bagage (kg)"
                    type="text"
                    value={baggageWeight}
                    onChange={(e) => setBaggageWeight(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: '"Inter", sans-serif',
                        '&:hover fieldset': {
                          borderColor: '#2eb378'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2eb378'
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2eb378'
                      }
                    }}
                  />

                  <TextField
                    label="Description du bagage"
                    multiline
                    rows={3}
                    value={baggageDescription}
                    onChange={(e) => setBaggageDescription(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: '"Inter", sans-serif',
                        '&:hover fieldset': {
                          borderColor: '#2eb378'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2eb378'
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2eb378'
                      }
                    }}
                  />

                  <TextField
                    label="Lieu de départ"
                    type="text"
                    value={departure}
                    onChange={(e) => setDeparture(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: '"Inter", sans-serif',
                        '&:hover fieldset': {
                          borderColor: '#2eb378'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2eb378'
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2eb378'
                      }
                    }}
                  />

                  <TextField
                    label="Lieu d'arrivée"
                    type="text"
                    value={arrival}
                    onChange={(e) => setArrival(e.target.value)}
                    fullWidth
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                        fontFamily: '"Inter", sans-serif',
                        '&:hover fieldset': {
                          borderColor: '#2eb378'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2eb378'
                        }
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2eb378'
                      }
                    }}
                  />

                  <Button
                    onClick={generateBaggageQrCode}
                    variant="contained"
                    fullWidth
                    startIcon={<QrCodeIcon />}
                    sx={{
                      bgcolor: '#2eb378',
                      color: 'white',
                      borderRadius: '12px',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      py: 1.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      '&:hover': { bgcolor: '#26a566' }
                    }}
                  >
                    Générer QR Code
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* COLONNE DROITE: Liste QR Codes */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(57, 56, 57, 0.10)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    color: '#393839',
                    mb: 3
                  }}
                >
                  QR Codes des bagages ({baggageQrCodes.length})
                </Typography>

                {baggageQrCodes.length > 0 ? (
                  <Grid container spacing={2}>
                    {baggageQrCodes.map((qrCode, index) => {
                      try {
                        const baggageData = JSON.parse(qrCode);
                        return (
                          <Grid item xs={12} sm={6} key={index}>
                            <Card
                              sx={{
                                borderRadius: 2,
                                border: '1px solid rgba(91, 188, 234, 0.2)',
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <CardContent>
                                {/* QR Code */}
                                <Box
                                  id={`baggage-qr-${index}`}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    mb: 2,
                                    p: 2,
                                    bgcolor: '#F7F9FB',
                                    borderRadius: 1,
                                    border: '2px solid #5bbcea'
                                  }}
                                >
                                  <QRCodeSVG value={qrCode} size={120} />
                                </Box>

                                {/* Infos */}
                                <Box sx={{ mb: 2 }}>
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                      Poids
                                    </Typography>
                                    <Typography sx={{ fontWeight: 600, color: '#393839', fontSize: '0.95rem' }}>
                                      {baggageData.weight} kg
                                    </Typography>
                                  </Box>
                                  <Box sx={{ mb: 1 }}>
                                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                      Description
                                    </Typography>
                                    <Typography sx={{ fontWeight: 500, color: '#393839', fontSize: '0.85rem' }}>
                                      {baggageData.description}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                      Parcours
                                    </Typography>
                                    <Typography sx={{ fontWeight: 500, color: '#393839', fontSize: '0.85rem' }}>
                                      {baggageData.departure} → {baggageData.arrival}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Actions */}
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownloadQR(qrCode, index)}
                                    sx={{
                                      flex: 1,
                                      borderRadius: '8px',
                                      color: '#2eb378',
                                      border: '1px solid #2eb378',
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      fontFamily: '"Inter", sans-serif',
                                      '&:hover': {
                                        bgcolor: 'rgba(46, 179, 120, 0.08)',
                                        borderColor: '#26a566'
                                      }
                                    }}
                                  >
                                    Télécharger
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => deleteBaggageQrCode(index)}
                                    sx={{
                                      flex: 1,
                                      borderRadius: '8px',
                                      color: '#EF4444',
                                      border: '1px solid #EF4444',
                                      fontSize: '0.75rem',
                                      textTransform: 'none',
                                      fontFamily: '"Inter", sans-serif',
                                      '&:hover': {
                                        bgcolor: 'rgba(239, 68, 68, 0.08)',
                                        borderColor: '#dc2626'
                                      }
                                    }}
                                  >
                                    Supprimer
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      } catch (e) {
                        return null;
                      }
                    })}
                  </Grid>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <QrCodeIcon sx={{ fontSize: 64, color: 'rgba(57, 56, 57, 0.2)', mb: 2 }} />
                    <Typography variant="body1" sx={{ color: 'rgba(57, 56, 57, 0.5)', fontFamily: '"Inter", sans-serif' }}>
                      Aucun QR code bagage pour le moment
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(57, 56, 57, 0.4)', fontFamily: '"Inter", sans-serif', mt: 1 }}>
                      Créez votre premier QR code avec le formulaire ci-contre
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Snackbars pour les messages */}
        <Snackbar
          open={!!successMessage}
          autoHideDuration={3000}
          onClose={() => setSuccessMessage("")}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            {successMessage}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!errorMessage}
          autoHideDuration={3000}
          onClose={() => setErrorMessage("")}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default BaggageTracking;
