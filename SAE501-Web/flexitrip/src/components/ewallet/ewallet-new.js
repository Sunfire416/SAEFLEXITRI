import React, { useState, useEffect, useContext } from 'react';
import './ewallet.css';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useQrCode } from '../../context/QrCodeContext';
import { useBaggage } from '../../context/BaggageContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import { Download as DownloadIcon, Delete as DeleteIcon } from '@mui/icons-material';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

function Ewallet() {
  const { user } = useContext(AuthContext);
  const { qrCodes, setQrCodes } = useQrCode();
  const { baggageQrCodes, setBaggageQrCodes } = useBaggage();
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [receiverId, setReceiverId] = useState(1);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch balance et historique
  const fetchBalance = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/blockchain/balance`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBalance(response.data.balance);
    } catch (err) {
      console.error("Erreur lors de la récupération du solde:", err);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/blockchain/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPaymentHistory(response.data);
    } catch (err) {
      console.error("Erreur lors de la récupération de l'historique:", err);
    }
  };

  useEffect(() => {
    if (!token || !user || !user.user_id) return;
    fetchBalance();
    fetchPaymentHistory();
  }, [token, user]);

  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setError("❌ Veuillez entrer un montant valide.");
      return;
    }
    if (paymentAmount > balance) {
      setError("❌ Solde insuffisant.");
      return;
    }

    try {
      const paymentData = {
        sender: user.user_id,
        receiver: receiverId,
        amount: paymentAmount,
        description: "Paiement"
      };

      const response = await axios.post(
        `${API_BASE_URL}/transactions/pay`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 || response.data.success) {
        fetchBalance();
        fetchPaymentHistory();
        setError(null);
        setPaymentAmount(0);
        alert("Paiement réussi !");
      }
    } catch (error) {
      console.error("Erreur lors du paiement :", error);
      setError("❌ Erreur lors du paiement. Veuillez réessayer.");
    }
  };

  const parseQRData = (qrData) => {
    try {
      const data = JSON.parse(qrData);
      const labels = {
        departure: 'Départ',
        destination: 'Destination',
        transportType: 'Type de transport',
        needTaxiToAirport: 'Taxi à aéroport',
        needTaxiToDestination: 'Taxi à destination',
        totalPrice: 'Prix total',
        id_voyage: 'ID Voyage'
      };

      return (
        <div className="qr-card-info">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="qr-info-row">
              <span className="qr-label">{labels[key] || key}:</span>
              <span className="qr-value">
                {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : value}
              </span>
            </div>
          ))}
        </div>
      );
    } catch (error) {
      return <p>{qrData}</p>;
    }
  };

  const handleDownloadQR = (qrData, index) => {
    const element = document.getElementById(`qr-${index}`);
    if (element) {
      const url = element.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-voyage-${index}.png`;
      link.click();
    }
  };

  return (
    <Box className="ewallet-page" sx={{ bgcolor: '#F7F9FB', py: 5, minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 5 }}>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"Inter", "Stem Extra Light", sans-serif',
              fontWeight: 600,
              color: '#393839',
              mb: 1
            }}
          >
            Mon Portefeuille
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(57, 56, 57, 0.7)',
              fontFamily: '"Inter", sans-serif'
            }}
          >
            Gérez votre solde, historique et vos codes d'accès
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* === COLONNE 1 : PROFIL + PAIEMENT === */}
          <Grid item xs={12} md={5}>
            {/* CARD PROFIL */}
            {user && (
              <Card
                sx={{
                  borderRadius: 2,
                  border: '1px solid rgba(57, 56, 57, 0.10)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  mb: 3
                }}
              >
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      color: '#393839',
                      mb: 2
                    }}
                  >
                    Mon Profil
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)' }}>
                      Nom
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#393839' }}>
                      {user.prenom || ''} {user.nom || 'Non renseigné'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)' }}>
                      Email
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#393839', wordBreak: 'break-all' }}>
                      {user.email}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)' }}>
                      Téléphone
                    </Typography>
                    <Typography sx={{ fontWeight: 500, color: '#393839' }}>
                      {user.phone || 'Non renseigné'}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)' }}>
                      Rôle:
                    </Typography>
                    <Chip
                      label={user.role || 'Utilisateur'}
                      size="small"
                      sx={{
                        bgcolor: user.role === 'PMR' ? '#E3F2FD' : '#F3E5F5',
                        color: user.role === 'PMR' ? '#1976d2' : '#7b1fa2',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* CARD SOLDE */}
            <Card
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(57, 56, 57, 0.10)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                background: 'linear-gradient(135deg, #2eb378 0%, #26a566 100%)',
                color: 'white',
                mb: 3
              }}
            >
              <CardContent>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  Solde disponible
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 700,
                    mt: 1
                  }}
                >
                  {balance.toFixed(2)} €
                </Typography>
              </CardContent>
            </Card>

            {/* CARD PAIEMENT */}
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
                    mb: 2
                  }}
                >
                  Effectuer un paiement
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block', mb: 0.5 }}>
                      Montant (€)
                    </Typography>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(57, 56, 57, 0.15)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block', mb: 0.5 }}>
                      ID Destinataire
                    </Typography>
                    <input
                      type="number"
                      value={receiverId}
                      onChange={(e) => setReceiverId(parseInt(e.target.value) || 1)}
                      placeholder="1"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(57, 56, 57, 0.15)',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </Box>

                  <Button
                    onClick={handlePayment}
                    fullWidth
                    sx={{
                      bgcolor: '#2eb378',
                      color: 'white',
                      borderRadius: '12px',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 600,
                      py: 1.2,
                      '&:hover': { bgcolor: '#26a566' }
                    }}
                  >
                    Payer
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* === COLONNE 2 : HISTORIQUE + QR === */}
          <Grid item xs={12} md={7}>
            {/* HISTORIQUE PAIEMENTS */}
            <Card
              sx={{
                borderRadius: 2,
                border: '1px solid rgba(57, 56, 57, 0.10)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                mb: 3
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    color: '#393839',
                    mb: 2
                  }}
                >
                  Historique des Paiements
                </Typography>

                {paymentHistory && paymentHistory.length > 0 ? (
                  <Box sx={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {paymentHistory.map((payment, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: '#F7F9FB',
                          borderRadius: 1,
                          borderLeft: '4px solid #2eb378'
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 500, color: '#393839', fontSize: '0.95rem' }}>
                            {payment.description || 'Paiement'}
                          </Typography>
                          <Typography sx={{ fontWeight: 600, color: '#2eb378' }}>
                            +{payment.amount}€
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)' }}>
                          {new Date(payment.date || Date.now()).toLocaleDateString('fr-FR')}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'rgba(57, 56, 57, 0.5)' }}>
                      Aucune transaction pour le moment
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* QR CODES TRAJETS */}
            {qrCodes && qrCodes.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    color: '#393839',
                    mb: 2
                  }}
                >
                  QR Codes des Voyages
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {qrCodes.map((qr, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: '1px solid rgba(57, 56, 57, 0.10)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%'
                        }}
                      >
                        <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                          <Box
                            id={`qr-${index}`}
                            sx={{
                              display: 'flex',
                              justifyContent: 'center',
                              mb: 2,
                              p: 1.5,
                              bgcolor: '#F7F9FB',
                              borderRadius: 1
                            }}
                          >
                            <QRCodeSVG value={qr} size={120} />
                          </Box>

                          {parseQRData(qr)}

                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDownloadQR(qr, index)}
                              sx={{
                                flex: 1,
                                borderRadius: '8px',
                                color: '#2eb378',
                                border: '1px solid #2eb378',
                                fontSize: '0.75rem',
                                textTransform: 'none'
                              }}
                            >
                              Télécharger
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DeleteIcon />}
                              onClick={() => setQrCodes(qrCodes.filter((_, i) => i !== index))}
                              sx={{
                                flex: 1,
                                borderRadius: '8px',
                                color: '#EF4444',
                                border: '1px solid #EF4444',
                                fontSize: '0.75rem',
                                textTransform: 'none'
                              }}
                            >
                              Supprimer
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ textAlign: 'right' }}>
                  <Button
                    onClick={() => setQrCodes([])}
                    startIcon={<DeleteIcon />}
                    sx={{
                      color: '#EF4444',
                      border: '1px solid #EF4444',
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 500
                    }}
                  >
                    Supprimer tous les codes
                  </Button>
                </Box>
              </Box>
            )}

            {/* QR CODES BAGAGES */}
            {baggageQrCodes && baggageQrCodes.length > 0 && (
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 600,
                    color: '#393839',
                    mb: 2
                  }}
                >
                  QR Codes des Bagages
                </Typography>

                <Grid container spacing={2}>
                  {baggageQrCodes.map((qr, index) => {
                    try {
                      const baggageData = JSON.parse(qr);
                      return (
                        <Grid item xs={12} sm={6} md={6} key={index}>
                          <Card
                            sx={{
                              borderRadius: 2,
                              border: '1px solid rgba(57, 56, 57, 0.10)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                            }}
                          >
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'center',
                                  mb: 1.5,
                                  p: 1,
                                  bgcolor: '#F7F9FB',
                                  borderRadius: 1
                                }}
                              >
                                <QRCodeSVG value={qr} size={100} />
                              </Box>

                              <Box sx={{ textAlign: 'left', fontSize: '0.85rem' }}>
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                    Poids
                                  </Typography>
                                  <Typography sx={{ fontWeight: 500, color: '#393839' }}>
                                    {baggageData.weight || 'N/A'} kg
                                  </Typography>
                                </Box>
                                <Box sx={{ mb: 1 }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                    Parcours
                                  </Typography>
                                  <Typography sx={{ fontWeight: 500, color: '#393839', fontSize: '0.8rem' }}>
                                    {baggageData.departure || 'N/A'} → {baggageData.arrival || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>

                              <Button
                                size="small"
                                startIcon={<DeleteIcon />}
                                onClick={() => setBaggageQrCodes(baggageQrCodes.filter((_, i) => i !== index))}
                                sx={{
                                  mt: 1.5,
                                  color: '#EF4444',
                                  border: '1px solid #EF4444',
                                  borderRadius: '8px',
                                  fontSize: '0.7rem',
                                  textTransform: 'none',
                                  width: '100%'
                                }}
                              >
                                Supprimer
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    } catch (e) {
                      return null;
                    }
                  })}
                </Grid>
              </Box>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default Ewallet;
