import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ewallet.css';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
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
  Divider,
  TextField,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Snackbar,
  Pagination,
  Stack,
  InputAdornment
} from '@mui/material';
import {
  QrCode2 as QrCodeIcon,
  Payment as PaymentIcon,
  Apple as AppleIcon,
  Google as GoogleIcon,
  CreditCard as CreditCardIcon,
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';
const TOPUP_RECEIVER_ID = "2462094f-0ed6-4cb0-946a-427d615c008f";

// Taux fixes
const EXCHANGE_RATES = {
  EUR: 1.00,
  USD: 0.92,
  GBP: 1.17
};

const PROCESSING_FEE_PERCENT = 0.015; // 1.5%

function Ewallet() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);

  // Historique state
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all'); // all, recharge, payment
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Recharge state
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [amountInput, setAmountInput] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [isProcessing, setIsProcessing] = useState(false);

  // Feedback
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastTopup, setLastTopup] = useState(null); // Pour le reçu PDF

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) setToken(storedToken);
  }, []);

  // --- 1. Calculs Centralisés (Math.round 2 décimales) ---
  const calculateTotals = useCallback(() => {
    const val = parseFloat(amountInput);
    if (!val || isNaN(val) || val <= 0) {
      return { converted: 0, fee: 0, credited: 0, rate: 0, isValid: false };
    }

    const rate = EXCHANGE_RATES[currency] || 1;

    // Règle: converted = input * rate (arrondi 2 déc)
    const convertedRaw = val * rate;
    const converted = Math.round(convertedRaw * 100) / 100;

    // Règle: fee = converted * 0.015 (arrondi 2 déc)
    const feeRaw = converted * PROCESSING_FEE_PERCENT;
    const fee = Math.round(feeRaw * 100) / 100;

    // Règle: credited = converted - fee (arrondi 2 déc)
    const creditedRaw = converted - fee;
    const credited = Math.round(creditedRaw * 100) / 100;

    return {
      converted,
      fee,
      credited,
      rate,
      isValid: true
    };
  }, [amountInput, currency]);

  const totals = calculateTotals();

  // --- 2. Normalisation Historique ---
  const normalizeTx = (tx) => {
    if (!tx) return null;

    // Date fallback
    const dateStr = tx.date_payement || tx.date || tx.timestamp || tx.created_at || new Date().toISOString();

    // Description logic
    let description = tx.metadata?.description || tx.description || tx.label || tx.memo || 'Transaction';
    const descLower = description.toLowerCase();

    // Règle Spéciale Prompt : Transformation Label Système
    // Si c'est un crédit venant de l'admin (TOPUP_RECEIVER_ID), c'est une recharge démo
    let isRecharge = descLower.includes('recharge') || (tx.type === 'credit' && description.includes(TOPUP_RECEIVER_ID));

    if (isRecharge) {
      description = "Recharge portefeuille (DEMO)";
    }

    // Montant fallback
    const rawAmt = tx.amount ?? tx.value ?? tx.total ?? 0;
    const amountVal = Number(rawAmt);

    // Détection type
    const isCreditType = tx.type === 'credit' || (tx.metadata && tx.metadata.original_type === 'credit');

    // Logique "Direction" (Crédit ou Débit pour l'utilisateur)
    // - Si je suis le receiver => Crédit
    // - Si c'est marqué 'recharge' => Crédit
    // - Si je suis le sender et pas recharge => Débit

    let direction = 'debit';
    if (tx.receiver === user.user_id || isRecharge || isCreditType) {
      direction = 'credit';
    } else if (tx.sender === user.user_id) {
      direction = 'debit';
    }

    // Catégorie pour filtres
    let category = 'payment';
    if (isRecharge) category = 'recharge';

    // UI Props
    const sign = direction === 'credit' ? '+' : '-';
    // Vert pour crédit/recharge, Rouge pour débit
    const color = direction === 'credit' ? '#2eb378' : '#EF4444';

    return {
      id: tx.id || Math.random().toString(36),
      date: new Date(dateStr),
      description: description,
      amount: amountVal,
      currency: tx.currency || 'EUR',
      type: direction === 'credit' ? (isRecharge ? 'Recharge' : 'Crédit') : 'Débit',
      category: category,
      sign: sign,
      color: color,
      isDemo: isRecharge || descLower.includes('demo')
    };
  };

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/blockchain/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend source of truth
      setBalance(Number(res.data.balance) || 0);

      if (process.env.NODE_ENV !== 'production') {
        console.log("BALANCE API RAW:", res.data);
      }
    } catch (err) {
      console.error("Fetch Balance Error:", err);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/blockchain/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const raw = res.data;
      // Normalisation API response structure
      const arr = Array.isArray(raw) ? raw : (raw.transactions || raw.history || raw.data || []);

      const normalized = arr.map(normalizeTx).filter(x => x !== null);
      // Tri date DESC
      normalized.sort((a, b) => b.date - a.date);

      setPaymentHistory(normalized);
    } catch (err) {
      console.error("Fetch History Error:", err);
      // Fallback vide pas d'erreur fatale
      setPaymentHistory([]);
    }
  };

  useEffect(() => {
    if (token && user?.user_id) {
      fetchBalance();
      fetchPaymentHistory();
    }
  }, [token, user]);

  // --- 3. Recharge (Strict Guard) ---
  const handleTopup = async () => {
    // GUARD STRICT : PREMIÈRE LIGNE
    if (isProcessing) return;

    if (!totals.isValid) {
      setSnackbar({ open: true, message: "❌ Montant invalide.", severity: 'error' });
      return;
    }

    setIsProcessing(true);
    setError(null);

    const methodLabel = {
      paypal: 'PayPal', card: 'Carte Bancaire', applepay: 'Apple Pay', googlepay: 'Google Pay'
    }[paymentMethod] || 'Paiement';

    // Payload Admin -> User
    const payload = {
      sender: TOPUP_RECEIVER_ID,
      receiver: user.user_id,
      amount: totals.credited, // Montant net
      description: `Recharge portefeuille (DEMO) - ${methodLabel} - ${currency}`
    };

    // Logging Dev (avant POST)
    if (process.env.NODE_ENV !== 'production') {
      console.group("TOPUP DEBUG");
      console.log("Input:", { amount: amountInput, currency, method: paymentMethod });
      console.log("Calculated:", {
        rate: totals.rate,
        convertedEUR: totals.converted,
        feeEUR: totals.fee,
        creditedEUR: totals.credited
      });
      console.log("Payload:", payload);
      console.groupEnd();
    }

    try {
      // Simulation délai ux
      await new Promise(r => setTimeout(r, 800));

      await axios.post(`${API_BASE_URL}/transactions/pay`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // SUCCÈS : Refresh Only (Pas de setBalance local)
      await fetchBalance();
      await fetchPaymentHistory();

      // Sauvegarde pour le reçu
      setLastTopup({
        date: new Date(),
        method: methodLabel,
        amountInput: parseFloat(amountInput),
        currency: currency,
        rate: totals.rate,
        fee: totals.fee,
        credited: totals.credited,
        txId: `DEMO-${Date.now()}`
      });

      setSnackbar({ open: true, message: "✅ Recharge effectuée avec succès !", severity: 'success' });
      setAmountInput(''); // Reset champ

    } catch (err) {
      console.error("TOPUP ERROR RAW:", err.response || err);
      const msg = err.response?.data?.error || err.response?.data?.message || "Erreur lors de la recharge.";
      setSnackbar({ open: true, message: `❌ ${msg}`, severity: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuick = (val) => {
    setAmountInput(prev => (parseFloat(prev || 0) + val).toString());
  };

  // --- 4. Export & PDF ---
  const exportCSV = () => {
    if (!paymentHistory.length) {
      setSnackbar({ open: true, message: "Aucune transaction à exporter.", severity: 'info' });
      return;
    }
    const header = "Date,Type,Montant,Devise,Description";
    const rows = paymentHistory.map(tx =>
      `${tx.date.toLocaleDateString('fr-FR')},${tx.type},${tx.sign}${tx.amount.toFixed(2)},${tx.currency},"${tx.description.replace(/"/g, '""')}"`
    );
    // AJOUT BOM \uFEFF pour Excel UTF-8
    const csvContent = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historique_flexitrip_${Date.now()}.csv`;
    link.click();
  };

  const generateReceiptPDF = () => {
    if (!lastTopup) return;
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Reçu de Transaction (DÉMO)", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Ce document est une simulation. Aucune valeur réelle.", 105, 28, { align: "center" });

    let y = 50;
    const addLine = (label, val, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(label, 20, y);
      doc.text(val, 190, y, { align: "right" });
      y += 10;
    };

    addLine("ID Transaction", lastTopup.txId);
    addLine("Date", lastTopup.date.toLocaleString());
    addLine("Utilisateur", user.email);
    y += 5;
    addLine("Méthode", lastTopup.method);

    // Détails financiers
    if (lastTopup.currency !== 'EUR') {
      addLine(`Montant (${lastTopup.currency})`, `${lastTopup.amountInput.toFixed(2)} ${lastTopup.currency}`);
      addLine("Taux de change", lastTopup.rate.toString());
    }

    doc.line(20, y, 190, y); y += 10;

    addLine("Montant converti (EUR)", `${(lastTopup.credited + lastTopup.fee).toFixed(2)} EUR`); // Reconstitution
    addLine("Frais de service (1.5%)", `-${lastTopup.fee.toFixed(2)} EUR`);

    doc.line(20, y, 190, y); y += 10;
    doc.setFontSize(14);
    addLine("TOTAL CRÉDITÉ", `+${lastTopup.credited.toFixed(2)} EUR`, true);

    doc.save(`recu_${lastTopup.txId}.pdf`);
  };

  // --- UI Helpers ---
  const filteredHistory = paymentHistory.filter(tx => {
    if (historyFilter === 'all') return true;
    return tx.category === historyFilter;
  });
  const pageCount = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const displayedHistory = filteredHistory.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <Box sx={{ bgcolor: '#F7F9FB', minHeight: '100vh', py: 5 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} color="#393839" sx={{ fontFamily: 'Inter, sans-serif' }}>
            Portefeuille
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gérez votre solde et vos transactions en toute simplicité
          </Typography>
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Grid container spacing={3}>

          {/* === COLONNE GAUCHE (MD=5) : Profil === */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ fontFamily: 'Inter' }}>
                    {user?.name} {user?.surname}
                  </Typography>
                  <Chip label={user?.role || 'User'} size="small" sx={{ bgcolor: '#E3F2FD', color: '#1976d2', fontWeight: 600 }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>{user?.email}</Typography>
                {user?.phone && <Typography variant="body2" color="text.secondary">{user.phone}</Typography>}

                <Button
                  onClick={() => navigate('/user/access')}
                  variant="outlined"
                  fullWidth
                  startIcon={<QrCodeIcon />}
                  sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e0e0e0', color: '#555' }}
                >
                  Mes QR Codes & Bagages
                </Button>
              </CardContent>
            </Card>

            {/* Note additionnelle */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Ce portefeuille est en mode <strong>DÉMO</strong>. Aucune transaction réelle n'est effectuée sur vos comptes bancaires.
            </Alert>
          </Grid>

          {/* === COLONNE DROITE (MD=7) : Solde & Recharge === */}
          <Grid item xs={12} md={7}>
            <Stack spacing={3}>

              {/* Carte Solde */}
              <Card sx={{
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2eb378 0%, #259f62 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(46, 179, 120, 0.25)'
              }}>
                <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500, letterSpacing: 0.5 }}>SOLDE DISPONIBLE</Typography>
                    <Typography variant="h3" fontWeight={700} sx={{ mt: 1, fontFamily: 'Inter' }}>
                      {balance.toFixed(2)} €
                    </Typography>
                  </Box>
                  <WalletIcon sx={{ fontSize: 48, opacity: 0.2 }} />
                </CardContent>
              </Card>

              {/* Carte Recharge */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} mb={3}>Recharger (DÉMO)</Typography>

                  {/* Méthodes */}
                  <Typography variant="caption" color="text.secondary" mb={1} display="block">Méthode de paiement</Typography>
                  <ToggleButtonGroup
                    value={paymentMethod}
                    exclusive
                    onChange={(e, v) => v && setPaymentMethod(v)}
                    fullWidth
                    sx={{ mb: 3 }}
                  >
                    <ToggleButton value="paypal" sx={{ flex: 1, textTransform: 'none' }}>PayPal</ToggleButton>
                    <ToggleButton value="card" sx={{ flex: 1, textTransform: 'none' }}>Carte</ToggleButton>
                    <ToggleButton value="applepay" sx={{ flex: 1, textTransform: 'none' }}>Apple</ToggleButton>
                  </ToggleButtonGroup>

                  {/* Montant & Devise */}
                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={8}>
                      <TextField
                        label="Montant"
                        placeholder="0.00"
                        type="number"
                        fullWidth
                        value={amountInput}
                        onChange={(e) => setAmountInput(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}</InputAdornment>
                        }}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <Select value={currency} fullWidth onChange={(e) => setCurrency(e.target.value)}>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                      </Select>
                    </Grid>
                  </Grid>

                  {/* Quick Amounts */}
                  <Stack direction="row" spacing={1} mb={3}>
                    {[10, 20, 50, 100].map(val => (
                      <Chip
                        key={val}
                        label={`+${val}`}
                        onClick={() => handleQuick(val)}
                        variant="outlined"
                        color="primary"
                        clickable
                      />
                    ))}
                  </Stack>

                  {/* Résumé Dynamique */}
                  {totals.isValid && (
                    <Box sx={{ bgcolor: '#F5F9FF', p: 2, borderRadius: 2, mb: 3, border: '1px solid #E3F2FD' }}>
                      {currency !== 'EUR' && (
                        <>
                          <Stack direction="row" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2" color="text.secondary">Montant original</Typography>
                            <Typography variant="body2" fontWeight={500}>{parseFloat(amountInput).toFixed(2)} {currency}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" mb={1}>
                            <Typography variant="body2" color="text.secondary">Taux conversion</Typography>
                            <Typography variant="body2" fontWeight={500}>{totals.rate}</Typography>
                          </Stack>
                          <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                        </>
                      )}

                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {currency === 'EUR' ? "Montant" : "Montant converti (EUR)"}
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>{totals.converted.toFixed(2)} EUR</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" color="text.secondary">Frais (1.5%)</Typography>
                        <Typography variant="body2" color="error" fontWeight={500}>-{totals.fee.toFixed(2)} EUR</Typography>
                      </Stack>
                      <Divider sx={{ my: 1 }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>À CRÉDITER</Typography>
                        <Typography variant="h6" fontWeight={700} color="#2eb378">+{totals.credited.toFixed(2)} EUR</Typography>
                      </Stack>
                    </Box>
                  )}

                  {/* Actions */}
                  <Button
                    onClick={handleTopup}
                    disabled={isProcessing || !totals.isValid}
                    fullWidth
                    variant="contained"
                    size="large"
                    sx={{
                      bgcolor: '#2eb378',
                      '&:hover': { bgcolor: '#26a566' },
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 700
                    }}
                  >
                    {isProcessing ? <CircularProgress size={24} color="inherit" /> : `Confirmer la recharge`}
                  </Button>

                  {lastTopup && (
                    <Button
                      onClick={generateReceiptPDF}
                      fullWidth
                      startIcon={<DownloadIcon />}
                      variant="text"
                      sx={{ mt: 1, textTransform: 'none' }}
                    >
                      Télécharger le reçu
                    </Button>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* === LIGNE 2 (MD=12) : Historique Full Width === */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: 'none' }}>
              <Box sx={{ p: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, borderBottom: '1px solid #f0f0f0' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="h6" fontWeight={600}>Historique</Typography>
                  {/* Filtres Type Banque */}
                  <ToggleButtonGroup
                    value={historyFilter}
                    exclusive
                    onChange={(e, v) => v && setHistoryFilter(v)}
                    size="small"
                    sx={{ bgcolor: '#f5f5f5' }}
                  >
                    <ToggleButton value="all" sx={{ px: 2, textTransform: 'none' }}>Tout</ToggleButton>
                    <ToggleButton value="recharge" sx={{ px: 2, textTransform: 'none' }}>Recharges</ToggleButton>
                    <ToggleButton value="payment" sx={{ px: 2, textTransform: 'none' }}>Paiements</ToggleButton>
                  </ToggleButtonGroup>
                </Stack>
                <Button startIcon={<FileDownloadIcon />} onClick={exportCSV} variant="outlined" size="small" sx={{ borderRadius: 2, textTransform: 'none' }}>
                  Export CSV
                </Button>
              </Box>

              <CardContent sx={{ p: 0 }}>
                {displayedHistory.length > 0 ? (
                  displayedHistory.map((tx, idx) => (
                    <Box
                      key={tx.id}
                      sx={{
                        p: 2, px: 3,
                        borderBottom: '1px solid #f9f9f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: '#fafafa' }
                      }}
                    >
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                          <Typography variant="body1" fontWeight={500} color="#333">
                            {tx.description}
                          </Typography>
                          {tx.isDemo && <Chip label="DÉMO" size="small" sx={{ height: 20, fontSize: '10px', bgcolor: '#e3f2fd', color: '#1976d2' }} />}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          {tx.date.toLocaleDateString('fr-FR')} à {tx.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>

                      <Typography variant="body1" fontWeight={600} sx={{ color: tx.color }}>
                        {tx.sign}{tx.amount.toFixed(2)} {tx.currency}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ p: 6, textAlign: 'center' }}>
                    <HistoryIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 2 }} />
                    <Typography color="text.secondary">Aucune transaction trouvée.</Typography>
                  </Box>
                )}
              </CardContent>

              {/* Pagination */}
              {pageCount > 1 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #f0f0f0' }}>
                  <Pagination count={pageCount} page={page} onChange={(e, v) => setPage(v)} color="primary" />
                </Box>
              )}
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

export default Ewallet;
