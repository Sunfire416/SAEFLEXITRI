import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Box, Typography, Button, Grid, Card, CardContent, Chip } from "@mui/material";
import { ArrowBack as ArrowBackIcon, Download as DownloadIcon, Delete as DeleteIcon, ArrowForward as ArrowForwardIcon, Add as AddIcon } from "@mui/icons-material";
import { useQrCode } from "../context/QrCodeContext";
import { useBaggage } from "../context/BaggageContext";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PAGE_SIZE_QR = 6;
const PAGE_SIZE_BAGGAGE = 4;

export default function UserAccessPage() {
    const navigate = useNavigate();
    const { qrCodes, setQrCodes } = useQrCode();
    const { baggageQrCodes, setBaggageQrCodes } = useBaggage();
    const [qrPage, setQrPage] = useState(1);
    const [baggagePage, setBaggagePage] = useState(1);

    useEffect(() => {
        setQrPage(1);
    }, [qrCodes]);

    useEffect(() => {
        setBaggagePage(1);
    }, [baggageQrCodes]);

    const extractCity = (locationStr) => {
        if (!locationStr) return 'N/A';
        const parts = locationStr.split(',');
        return parts[0].trim();
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
                totalPrice: 'Prix total'
            };

            return (
                <div className="qr-card-info">
                    {Object.entries(data).map(([key, value]) => {
                        if (key === 'id_voyage') return null;
                        let displayValue = value;
                        if (typeof value === 'boolean') {
                            displayValue = value ? 'Oui' : 'Non';
                        } else if ((key === 'departure' || key === 'destination') && typeof value === 'string') {
                            displayValue = extractCity(value);
                        }
                        return (
                            <div key={key} className="qr-info-row">
                                <span className="qr-label">{labels[key] || key}:</span>
                                <span className="qr-value">{displayValue}</span>
                            </div>
                        );
                    })}
                </div>
            );
        } catch (error) {
            return <p>{qrData}</p>;
        }
    };

    const handleDownloadQR = async (qrData, index) => {
        try {
            const data = JSON.parse(qrData);
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text('Résumé de Trajet', 20, 20);

            doc.setFontSize(11);
            let yPosition = 35;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height;

            const fields = [
                { label: 'Départ', value: extractCity(data.departure) },
                { label: 'Destination', value: extractCity(data.destination) },
                { label: 'Type de transport', value: data.transportType },
                { label: 'Taxi à aéroport', value: data.needTaxiToAirport ? 'Oui' : 'Non' },
                { label: 'Taxi à destination', value: data.needTaxiToDestination ? 'Oui' : 'Non' },
                { label: 'Prix total', value: `${data.totalPrice}€` }
            ];

            fields.forEach((field) => {
                if (yPosition + lineHeight > pageHeight - 10) {
                    doc.addPage();
                    yPosition = 20;
                }
                doc.text(`${field.label}:`, 20, yPosition);
                doc.text(String(field.value), 100, yPosition);
                yPosition += lineHeight;
            });

            const qrElement = document.getElementById(`qr-${index}`);
            if (qrElement) {
                yPosition += 5;
                if (yPosition + 60 > pageHeight - 10) {
                    doc.addPage();
                    yPosition = 20;
                }
                const canvas = await html2canvas(qrElement);
                const imgData = canvas.toDataURL('image/png');
                doc.addImage(imgData, 'PNG', 20, yPosition, 50, 50);
            }

            doc.save(`trajet-${index}.pdf`);
        } catch (error) {
            console.error('Erreur lors de la génération du PDF:', error);
            alert('Erreur lors du téléchargement du PDF');
        }
    };

    return (
        <Box sx={{ bgcolor: "#F7F9FB", width: "100%", minHeight: "100vh", py: 5 }}>
            <Container maxWidth="lg">
                {/* Header */}
                <Box sx={{ mb: 4 }}>
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate("/user/ewallet")}
                        sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                            fontFamily: '"Inter", sans-serif',
                            fontWeight: 500,
                            mb: 2
                        }}
                    >
                        Retour au portefeuille
                    </Button>

                    <Typography
                        variant="h4"
                        sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 600, color: "#393839", mb: 1 }}
                    >
                        Mes accès
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: "rgba(57, 56, 57, 0.7)", fontFamily: '"Inter", sans-serif', fontWeight: 500 }}
                    >
                        Retrouvez vos QR codes de voyages et vos bagages suivis
                    </Typography>
                </Box>

                {/* QR CODES VOYAGES */}
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
                            {qrCodes
                                .slice((qrPage - 1) * PAGE_SIZE_QR, qrPage * PAGE_SIZE_QR)
                                .map((qr, index) => {
                                    const globalIndex = (qrPage - 1) * PAGE_SIZE_QR + index;
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={globalIndex}>
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
                                                        id={`qr-${globalIndex}`}
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
                                                            onClick={() => handleDownloadQR(qr, globalIndex)}
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
                                                            Télécharger
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            startIcon={<DeleteIcon />}
                                                            onClick={() => setQrCodes(qrCodes.filter((_, i) => i !== globalIndex))}
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
                                                            Masquer
                                                        </Button>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                        </Grid>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            <Button
                                size="small"
                                disabled={qrPage === 1}
                                onClick={() => setQrPage((p) => Math.max(1, p - 1))}
                                sx={{
                                    textTransform: 'none',
                                    fontFamily: '"Inter", sans-serif',
                                    fontWeight: 500,
                                    borderRadius: '12px'
                                }}
                            >
                                Précédent
                            </Button>
                            <Button
                                size="small"
                                disabled={qrPage >= Math.ceil(qrCodes.length / PAGE_SIZE_QR)}
                                onClick={() => setQrPage((p) => Math.min(Math.ceil(qrCodes.length / PAGE_SIZE_QR), p + 1))}
                                sx={{
                                    textTransform: 'none',
                                    fontFamily: '"Inter", sans-serif',
                                    fontWeight: 500,
                                    borderRadius: '12px'
                                }}
                            >
                                Suivant
                            </Button>
                            <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.7)', fontFamily: '"Inter", sans-serif', fontWeight: 500 }}>
                                Page {qrPage} / {Math.max(1, Math.ceil(qrCodes.length / PAGE_SIZE_QR))}
                            </Typography>
                        </Box>

                        <Box sx={{ textAlign: 'right', mt: 2 }}>
                            <Button
                                onClick={() => setQrCodes([])}
                                startIcon={<DeleteIcon />}
                                sx={{
                                    color: '#EF4444',
                                    border: '1px solid #EF4444',
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontFamily: '"Inter", sans-serif',
                                    fontWeight: 500,
                                    '&:hover': {
                                        bgcolor: 'rgba(239, 68, 68, 0.12)',
                                        borderColor: '#f87171'
                                    }
                                }}
                            >
                                Masquer tous les voyages
                            </Button>
                        </Box>
                    </Box>
                )}

                {/* MES BAGAGES */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontFamily: '"Inter", sans-serif',
                                fontWeight: 600,
                                color: '#393839'
                            }}
                        >
                            Mes Bagages
                        </Typography>
                        {baggageQrCodes && baggageQrCodes.length > 0 && (
                            <Chip
                                label={`${baggageQrCodes.length} bagage${baggageQrCodes.length > 1 ? 's' : ''}`}
                                size="small"
                                sx={{
                                    bgcolor: '#E3F2FD',
                                    color: '#5bbcea',
                                    fontWeight: 500
                                }}
                            />
                        )}
                    </Box>

                    {baggageQrCodes && baggageQrCodes.length > 0 ? (
                        <>
                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                {baggageQrCodes
                                    .slice((baggagePage - 1) * PAGE_SIZE_BAGGAGE, baggagePage * PAGE_SIZE_BAGGAGE)
                                    .map((qr, index) => {
                                        const globalIndex = (baggagePage - 1) * PAGE_SIZE_BAGGAGE + index;
                                        try {
                                            const baggageData = JSON.parse(qr);
                                            return (
                                                <Grid item xs={12} sm={6} md={4} key={globalIndex}>
                                                    <Card
                                                        sx={{
                                                            borderRadius: 2,
                                                            border: '1px solid rgba(57, 56, 57, 0.10)',
                                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                                            height: '100%'
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
                                                                <QRCodeSVG value={qr} size={80} />
                                                            </Box>

                                                            <Box sx={{ textAlign: 'left', fontSize: '0.85rem' }}>
                                                                <Box sx={{ mb: 0.5 }}>
                                                                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                                                        Poids
                                                                    </Typography>
                                                                    <Typography sx={{ fontWeight: 500, color: '#393839', fontSize: '0.85rem' }}>
                                                                        {baggageData.weight || 'N/A'} kg
                                                                    </Typography>
                                                                </Box>
                                                                <Box>
                                                                    <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.6)', display: 'block' }}>
                                                                        Parcours
                                                                    </Typography>
                                                                    <Typography sx={{ fontWeight: 500, color: '#393839', fontSize: '0.75rem' }}>
                                                                        {baggageData.departure || 'N/A'} → {baggageData.arrival || 'N/A'}
                                                                    </Typography>
                                                                </Box>
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

                            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <Button
                                    size="small"
                                    disabled={baggagePage === 1}
                                    onClick={() => setBaggagePage((p) => Math.max(1, p - 1))}
                                    sx={{
                                        textTransform: 'none',
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 500,
                                        borderRadius: '12px'
                                    }}
                                >
                                    Précédent
                                </Button>
                                <Button
                                    size="small"
                                    disabled={baggagePage >= Math.ceil(baggageQrCodes.length / PAGE_SIZE_BAGGAGE)}
                                    onClick={() => setBaggagePage((p) => Math.min(Math.ceil(baggageQrCodes.length / PAGE_SIZE_BAGGAGE), p + 1))}
                                    sx={{
                                        textTransform: 'none',
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 500,
                                        borderRadius: '12px'
                                    }}
                                >
                                    Suivant
                                </Button>
                                <Typography variant="caption" sx={{ color: 'rgba(57, 56, 57, 0.7)', fontFamily: '"Inter", sans-serif', fontWeight: 500 }}>
                                    Page {baggagePage} / {Math.max(1, Math.ceil(baggageQrCodes.length / PAGE_SIZE_BAGGAGE))}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => navigate('/user/baggage-tracking')}
                                    sx={{
                                        flex: 1,
                                        minWidth: '200px',
                                        color: '#2eb378',
                                        borderColor: '#2eb378',
                                        borderRadius: '12px',
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 600,
                                        py: 1.2,
                                        textTransform: 'none',
                                        '&:hover': {
                                            borderColor: '#26a566',
                                            bgcolor: 'rgba(46, 179, 120, 0.10)'
                                        }
                                    }}
                                >
                                    Voir tous mes bagages
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/user/baggage-tracking')}
                                    sx={{
                                        flex: 1,
                                        minWidth: '200px',
                                        bgcolor: '#2eb378',
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 600,
                                        py: 1.2,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#26a566' }
                                    }}
                                >
                                    Ajouter un bagage
                                </Button>
                            </Box>
                        </>
                    ) : (
                        <Card
                            sx={{
                                borderRadius: 2,
                                border: '1px solid rgba(57, 56, 57, 0.10)',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                textAlign: 'center',
                                py: 4
                            }}
                        >
                            <CardContent>
                                <Typography variant="body2" sx={{ color: 'rgba(57, 56, 57, 0.5)', mb: 2 }}>
                                    Aucun bagage enregistré pour le moment
                                </Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => navigate('/user/baggage-tracking')}
                                    sx={{
                                        bgcolor: '#2eb378',
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontFamily: '"Inter", sans-serif',
                                        fontWeight: 600,
                                        py: 1.2,
                                        px: 3,
                                        textTransform: 'none',
                                        '&:hover': { bgcolor: '#26a566' }
                                    }}
                                >
                                    Ajouter mon premier bagage
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </Box>
            </Container>
        </Box>
    );
}
