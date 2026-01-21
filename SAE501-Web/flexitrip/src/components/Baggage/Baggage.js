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
  Snackbar,
  Pagination,
  Chip
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

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // --- Logic Helpers ---
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
      setErrorMessage("Données trop volumineuses.");
      return;
    }
    setBaggageQrCodes([...baggageQrCodes, qrCodeData]);
    setBaggageWeight(""); setBaggageDescription(""); setDeparture(""); setArrival("");
    setSuccessMessage("QR Code généré avec succès !");
  };

  const deleteBaggageQrCode = (index) => {
    setBaggageQrCodes((prev) => prev.filter((_, i) => i !== index));
  };

  // --- PDF GENERATION FIX (SQUARE & SHARP) ---
  const handleDownloadQR = async (qrData, globalIndex) => {
    try {
      const data = JSON.parse(qrData);
      const doc = new jsPDF();

      // En-tête Textuel
      doc.setFontSize(16);
      doc.text('QR Code Bagage', 105, 20, { align: 'center' });

      doc.setFontSize(12);
      let y = 40;
      const addLine = (label, val) => {
        doc.text(`${label}: ${val}`, 20, y);
        y += 8;
      };

      addLine('Poids', `${data.weight} kg`);
      addLine('Description', data.description);
      addLine('Départ', data.departure);
      addLine('Arrivée', data.arrival);

      // --- CAPTURE QR CARRÉE ---
      const elementId = `baggage-qr-${globalIndex}`;
      const element = document.getElementById(elementId);

      if (element) {
        // Capture sans marges excessives, sur fond blanc
        const canvas = await html2canvas(element, {
          scale: 3,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');

        // Rendu PDF Carré (w === h)
        const size = 80;
        const xPos = (210 - size) / 2; // Centré
        const yPos = y + 10;

        doc.addImage(imgData, 'PNG', xPos, yPos, size, size);
      }

      doc.save(`bagage_${globalIndex + 1}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      setErrorMessage('Erreur génération PDF');
    }
  };

  // --- Pagination Logic ---
  React.useEffect(() => setPage(1), [baggageQrCodes.length]);
  const totalPages = Math.max(1, Math.ceil(baggageQrCodes.length / PAGE_SIZE));
  const paginated = baggageQrCodes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Box sx={{ bgcolor: '#F7F9FB', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600} color="#393839" sx={{ fontFamily: '"Inter", sans-serif' }}>
            Gestion des Bagages
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
            Générez et imprimez vos étiquettes bagages (QR Codes)
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Formulaire (MD=5) */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <QrCodeIcon sx={{ color: '#2eb378' }} />
                  <Typography variant="h6" fontWeight={600} sx={{ fontFamily: '"Inter", sans-serif' }}>Nouveau Bagage</Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField label="Poids (kg)" value={baggageWeight} onChange={e => setBaggageWeight(e.target.value)} fullWidth />
                  <TextField label="Description" value={baggageDescription} onChange={e => setBaggageDescription(e.target.value)} fullWidth multiline rows={2} />
                  <TextField label="Départ" value={departure} onChange={e => setDeparture(e.target.value)} fullWidth />
                  <TextField label="Arrivée" value={arrival} onChange={e => setArrival(e.target.value)} fullWidth />

                  <Button
                    onClick={generateBaggageQrCode}
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{
                      bgcolor: '#2eb378',
                      '&:hover': { bgcolor: '#26a566' },
                      mt: 2,
                      fontFamily: '"Inter", sans-serif'
                    }}
                  >
                    Générer QR Code
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Liste (MD=7) */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ fontFamily: '"Inter", sans-serif' }}>
                    Mes Bagages
                  </Typography>
                  {baggageQrCodes.length > 0 && (
                    <Chip
                      label={`${baggageQrCodes.length} bagage${baggageQrCodes.length > 1 ? 's' : ''}`}
                      size="small"
                      sx={{
                        bgcolor: '#E3F2FD',
                        color: '#5bbcea',
                        fontWeight: 500,
                        fontFamily: '"Inter", sans-serif'
                      }}
                    />
                  )}
                </Box>

                {baggageQrCodes.length > 0 ? (
                  <Grid container spacing={2}>
                    {paginated.map((qrCode, idx) => {
                      // Index Global
                      const globalIndex = (page - 1) * PAGE_SIZE + idx;
                      let data = {};
                      try { data = JSON.parse(qrCode); } catch (e) { }

                      return (
                        <Grid item xs={12} sm={6} key={globalIndex}>
                          <Card
                            variant="outlined"
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
                              <Box
                                id={`baggage-qr-${globalIndex}`}
                                sx={{
                                  display: 'flex', justifyContent: 'center',
                                  p: 2, mb: 2, bgcolor: 'white', border: '1px dashed #ddd'
                                }}
                              >
                                <QRCodeSVG value={qrCode} size={120} />
                              </Box>

                              <Typography variant="subtitle2" fontWeight={600} sx={{ fontFamily: '"Inter", sans-serif' }}>{data.description}</Typography>
                              <Typography variant="caption" display="block" sx={{ fontFamily: '"Inter", sans-serif' }}>{data.departure} → {data.arrival}</Typography>
                              <Typography variant="caption" display="block" mb={2} sx={{ fontFamily: '"Inter", sans-serif' }}>{data.weight} kg</Typography>

                              {/* Boutons Harmonisés (UserAccessPage style) */}
                              <Box display="flex" gap={1}>
                                <Button
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                  onClick={() => handleDownloadQR(qrCode, globalIndex)}
                                  sx={{
                                    flex: 1,
                                    borderRadius: '12px',
                                    color: '#2eb378',
                                    border: '1px solid #2eb378',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    fontFamily: '"Inter", sans-serif',
                                    fontWeight: 500,
                                    py: 0.75,
                                    '&:hover': {
                                      bgcolor: 'rgba(46, 179, 120, 0.10)',
                                      borderColor: '#26a566'
                                    }
                                  }}
                                >
                                  PDF
                                </Button>
                                <Button
                                  size="small"
                                  startIcon={<DeleteIcon />}
                                  onClick={() => deleteBaggageQrCode(globalIndex)}
                                  sx={{
                                    flex: 1,
                                    borderRadius: '12px',
                                    color: '#EF4444',
                                    border: '1px solid #EF4444',
                                    fontSize: '0.75rem',
                                    textTransform: 'none',
                                    fontFamily: '"Inter", sans-serif',
                                    fontWeight: 500,
                                    py: 0.75,
                                    '&:hover': {
                                      bgcolor: 'rgba(239, 68, 68, 0.12)',
                                      borderColor: '#f87171'
                                    }
                                  }}
                                >
                                  Suppr.
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box textAlign="center" py={5} color="text.secondary" sx={{ fontFamily: '"Inter", sans-serif' }}>
                    Pas de bagages enregistrés.
                  </Box>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box display="flex" justifyContent="center" mt={3}>
                    <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar open={!!successMessage} autoHideDuration={3000} onClose={() => setSuccessMessage("")}>
          <Alert severity="success">{successMessage}</Alert>
        </Snackbar>
        <Snackbar open={!!errorMessage} autoHideDuration={3000} onClose={() => setErrorMessage("")}>
          <Alert severity="error">{errorMessage}</Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default BaggageTracking;
