import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Avatar,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ContentCopy as CopyIcon,
  QrCode2 as QrIcon,
  InfoOutlined as InfoIcon,
  Accessible as AccessibleIcon
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AuthContext } from '../../context/AuthContext';
import apiService from '../../api/apiService';

const VoyageQRModal = ({ voyage, onClose }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);

        // Créer les données du QR code pour ce voyage
        const qrPayload = {
          id_voyage: voyage.id_voyage || voyage.voyage_id,
          depart: voyage.depart,
          arrivee: voyage.arrivee,
          date_debut: voyage.date_debut,
          date_fin: voyage.date_fin,
          user_id: user.user_id,
          assistance_PMR: voyage.reservations?.some(r => r.assistance_PMR === 'Oui') || false,
          timestamp: new Date().toISOString()
        };

        setQrData({
          success: true,
          qr_payload: qrPayload,
          qr_data_string: JSON.stringify(qrPayload)
        });

      } catch (err) {
        console.error('❌ Erreur génération QR:', err);
        setError('Impossible de générer le QR code de check-in');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [voyage, user]);

  const handleDownloadPDF = async () => {
    if (!qrData?.qr_data_string) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // En-tête avec logo FlexiTrip
      doc.setFillColor(46, 179, 120); // FlexiTrip Green
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FlexiTrip - Recapitulatif Voyage', pageWidth / 2, 10, { align: 'center' });

      yPosition = 25;
      doc.setTextColor(0, 0, 0);

      // Titre du voyage
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${voyage.depart} > ${voyage.arrivee}`, 20, yPosition);
      yPosition += 10;

      // Informations principales (sans l'ID voyage)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const mainInfo = [
        {
          label: 'Date de depart', value: new Date(voyage.date_debut).toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        },
        {
          label: 'Date d\'arrivee', value: new Date(voyage.date_fin).toLocaleDateString('fr-FR', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        },
        { label: 'Prix total', value: `${voyage.prix_total || 0} EUR` },
        { label: 'Statut', value: voyage.status || 'En attente' },
        { label: 'Assistance PMR', value: qrData.qr_payload?.assistance_PMR ? 'Oui (PMR)' : 'Non' }
      ];

      mainInfo.forEach(field => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text(`${field.label}:`, 20, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(String(field.value), 80, yPosition);
        yPosition += 7;
      });

      yPosition += 5;

      // QR Code
      const qrElement = document.getElementById('voyage-qr-code');
      if (qrElement) {
        if (yPosition + 60 > pageHeight - 10) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('QR Code d\'identification', 20, yPosition);
        yPosition += 8;

        const canvas = await html2canvas(qrElement, {
          scale: 2,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 20, yPosition, 55, 55);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text('Presentez ce code aux bornes FlexiTrip', 80, yPosition + 15);
        doc.text('ou au personnel pour l\'enregistrement', 80, yPosition + 22);
        doc.text('biometrique.', 80, yPosition + 29);

        yPosition += 65;
      }

      // Itinéraire détaillé
      if (voyage.etapes && voyage.etapes.length > 0) {
        if (yPosition + 20 > pageHeight - 10) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Itineraire detaille', 20, yPosition);
        yPosition += 10;

        voyage.etapes.forEach((etape, idx) => {
          if (yPosition + 25 > pageHeight - 10) {
            doc.addPage();
            yPosition = 20;
          }

          // Numéro d'étape
          doc.setFillColor(91, 188, 234); // Oxygen Blue
          doc.circle(25, yPosition - 2, 3, 'F');

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          const etapeTitle = etape.line ? `Ligne ${etape.line}` : (etape.compagnie || etape.type || 'Transport');
          doc.text(`Etape ${idx + 1}: ${etapeTitle}`, 32, yPosition);
          yPosition += 6;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          const departureTime = etape.departure_time ? new Date(etape.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';
          const arrivalTime = etape.arrival_time ? new Date(etape.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '';

          doc.text(`${departureTime} ${etape.departure_station || etape.adresse_1 || ''}`, 32, yPosition);
          yPosition += 5;
          doc.text(`> ${arrivalTime} ${etape.arrival_station || etape.adresse_2 || ''}`, 32, yPosition);

          if (etape.duration_minutes) {
            doc.setTextColor(100, 100, 100);
            doc.text(`Duree: ${etape.duration_minutes} min`, 32, yPosition + 5);
            doc.setTextColor(0, 0, 0);
            yPosition += 5;
          }

          yPosition += 8;
        });
      }

      // Pied de page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Document genere le ${new Date().toLocaleDateString('fr-FR')} a ${new Date().toLocaleTimeString('fr-FR')} - Page ${i}/${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Sauvegarder le PDF
      doc.save(`FlexiTrip-Voyage-${voyage.depart.replace(/\s+/g, '-')}-${voyage.arrivee.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const handleCopyData = () => {
    if (!qrData?.qr_payload) return;

    navigator.clipboard.writeText(JSON.stringify(qrData.qr_payload, null, 2));
    alert('✅ Données du QR code copiées dans le presse-papier !');
  };

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 4, overflow: 'hidden', backgroundImage: 'none' }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48, boxShadow: '0 4px 12px rgba(91, 188, 234, 0.3)' }}>
            <QrIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2 }}>Identification Voyage</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>{voyage.depart} → {voyage.arrivee}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main', bgcolor: 'rgba(239, 68, 68, 0.05)' } }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4, mt: 1 }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} />
            <Typography sx={{ mt: 3, fontWeight: 700 }} color="text.secondary">Génération sécurisée du code...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ py: 4 }}>
            <Alert severity="error" variant="filled" sx={{ borderRadius: 3, fontWeight: 700 }}>{error}</Alert>
          </Box>
        ) : qrData && (
          <Stack spacing={4} alignItems="center">
            <Paper elevation={0} sx={{ p: 3, border: '3px solid #f1f5f9', borderRadius: 4, bgcolor: '#fff', position: 'relative', overflow: 'visible' }}>
              <Box id="voyage-qr-code" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <QRCodeSVG
                  value={qrData.qr_data_string}
                  size={240}
                  level="H"
                  includeMargin={true}
                  fgColor="#1a1a1a"
                  bgColor="#ffffff"
                />
              </Box>
              <Box sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'success.main', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', boxShadow: theme.shadows[2], zIndex: 1 }}>Securise 🔒</Box>
            </Paper>

            <Box sx={{ width: '100%', p: 2.5, bgcolor: '#f8fafc', borderRadius: 4, border: '1px solid #e2e8f0' }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Date Depart</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>{new Date(voyage.date_debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Typography>
                </Grid>
                {qrData.qr_payload?.assistance_PMR && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#c2410c', fontWeight: 800 }}>
                      <AccessibleIcon fontSize="small" /> Assistance PMR activee pour ce trajet
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>

            <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', px: 2, bgcolor: 'rgba(59, 130, 246, 0.05)', py: 2, borderRadius: 3, border: '1px solid rgba(59, 130, 246, 0.1)' }}>
              Présentez ce code aux bornes <strong>FlexiTrip</strong> ou au personnel pour initier votre enregistrement biométrique.
            </Typography>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, px: 4, bgcolor: '#f8fafc', gap: 1 }}>
        <Button onClick={handleCopyData} variant="text" sx={{ fontWeight: 800, textTransform: 'none', color: 'text.secondary' }}>Copier les données</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleDownloadPDF} variant="outlined" startIcon={<DownloadIcon />} sx={{ borderRadius: 3, fontWeight: 800, textTransform: 'none', px: 3 }}>Télécharger</Button>
        <Button onClick={() => window.print()} variant="contained" startIcon={<PrintIcon />} sx={{ borderRadius: 3, fontWeight: 800, textTransform: 'none', px: 3, boxShadow: 'none' }}>Imprimer</Button>
      </DialogActions>
    </Dialog>
  );
};

export default VoyageQRModal;
