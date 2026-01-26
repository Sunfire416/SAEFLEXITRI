import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { isDemoMode } from '../../config/demoConfig';
import apiService from '../../api/apiService';
import VoyageCard from './VoyageCard';
import VoyageQRModal from './VoyageQRModal';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Stack,
  Tabs,
  Tab,
  Avatar,
  useTheme,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  AirplanemodeActive as AirplaneIcon,
  History as HistoryIcon,
  TrendingUp as StatsIcon,
  CheckCircle as SuccessIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  Accessible as AccessibleIcon,
  Add as AddIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';

const VoyageHistory = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [voyages, setVoyages] = useState([]);
  const [bagagesByReservationId, setBagagesByReservationId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // Modal QR
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedVoyage, setSelectedVoyage] = useState(null);

  const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  const currentFilter = filters[tabValue];

  const fetchBagages = async () => {
    try {
      if (user?.role && !['PMR', 'Accompagnant'].includes(user.role)) {
        setBagagesByReservationId({});
        return;
      }
      const response = await apiService.get('/bagages');
      const bagages = response?.bagages || [];
      const grouped = bagages.reduce((acc, bagage) => {
        const key = String(bagage.reservation_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(bagage);
        return acc;
      }, {});
      setBagagesByReservationId(grouped);
    } catch (err) {
      console.warn('⚠️ Impossible de charger les bagages:', err);
      setBagagesByReservationId({});
    }
  };

  const normalizeLocation = (loc) => {
    if (!loc) return 'N/A';
    if (typeof loc === 'string') return loc;
    if (typeof loc === 'object') {
      return loc.ville || loc.gare || loc.name || JSON.stringify(loc);
    }
    return String(loc);
  };

  const normalizeEtapes = (etapes = []) => {
    return etapes.map((e) => {
      const data = e.etape_data || {};
      return {
        ...e,
        type: e.type || e.transport || data.type,
        compagnie: data.compagnie,
        adresse_1: data.adresse_1 || e.start_station_snapshot?.name,
        adresse_2: data.adresse_2 || e.end_station_snapshot?.name,
        id: data.id
      };
    });
  };

  const normalizeVoyage = (v) => {
    const id = v.id_voyage || v.voyage_id || v.id;
    return {
      id,
      voyage_id: id,
      id_voyage: id,
      depart: normalizeLocation(v.depart || v.lieu_depart || v.Lieu_depart || v.start_station_snapshot),
      arrivee: normalizeLocation(v.arrivee || v.lieu_arrivee || v.Lieu_arrivee || v.end_station_snapshot),
      date_debut: v.date_debut || v.Date_depart,
      date_fin: v.date_fin || v.Date_arrivee,
      prix_total: v.prix_total,
      status: v.status || v.statut,
      etapes: normalizeEtapes(v.etapes),
      reservations: v.reservations || [],
      raw: v,
    };
  };

  const fetchVoyages = async () => {
    if (!user?.user_id) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiService.get('/voyages/history', {
        params: {
          user_id: user.user_id,
          status: currentFilter === 'all' ? null : currentFilter
        }
      });
      const normalized = (response?.voyages || []).map(normalizeVoyage);
      setVoyages(normalized);
    } catch (err) {
      if (!isDemoMode()) setError('Impossible de charger les voyages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoyages();
    fetchBagages();
  }, [user, currentFilter]);

  const handleOpenQR = (voyage) => {
    setSelectedVoyage(voyage);
    setQrModalOpen(true);
  };

  const handleCancelCheckin = async (reservationId) => {
    if (!window.confirm('Annuler le check-in ? Le boarding pass sera supprimé.')) return;
    try {
      const response = await apiService.patch(`/voyages/cancel-checkin/${reservationId}`, { user_id: user.user_id });
      if (response?.success) {
        alert('✅ Check-in annulé');
        fetchVoyages();
      }
    } catch (err) { alert('❌ Erreur lors de l\'annulation'); }
  };

  const handleDeleteVoyage = async (voyageId) => {
    if (!window.confirm('Supprimer définitivement ce voyage ?')) return;
    try {
      const response = await apiService.delete(`/voyages/${voyageId}`, { data: { user_id: user.user_id } });
      if (response?.success) {
        alert('✅ Voyage supprimé');
        fetchVoyages();
      }
    } catch (err) { alert('❌ Erreur lors de la suppression'); }
  };

  const stats = {
    total: voyages.length,
    confirmed: voyages.filter(v => ['confirmed', 'en_cours'].includes(v.status)).length,
    completed: voyages.filter(v => v.status === 'completed').length,
    pmr: voyages.filter(v => v.reservations?.some(r => r.assistance_PMR === 'Oui')).length,
    cancelled: voyages.filter(v => v.status === 'cancelled').length
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="h1" gutterBottom sx={{ fontWeight: 900, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>✈️ Mes Voyages</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>Consultez et gérez vos déplacements passés et à venir</Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => window.location.href = '/user/search'}
            sx={{ borderRadius: 4, px: 4, py: 1.5, fontWeight: 800, fontSize: '1rem', boxShadow: theme.shadows[4] }}
          >Planifier un voyage</Button>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { label: 'Total', value: stats.total, icon: <StatsIcon />, color: '#6366f1' },
            { label: 'Actifs', value: stats.confirmed, icon: <SuccessIcon />, color: '#2eb378' },
            { label: 'Terminés', value: stats.completed, icon: <AirplaneIcon />, color: '#5bbcea' },
            { label: 'Assistance', value: stats.pmr, icon: <AccessibleIcon />, color: '#f59e0b' }
          ].map((stat, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e2e8f0', bgcolor: 'white', '&:hover': { boxShadow: '0 10px 30px rgba(0,0,0,0.05)', transform: 'translateY(-2px)' }, transition: '0.3s' }}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, width: 44, height: 44 }}>{stat.icon}</Avatar>
                    <Typography variant="h3" fontWeight={900} sx={{ fontSize: '1.75rem' }}>{stat.value}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filters Tabs */}
        <Paper elevation={0} sx={{ mb: 5, borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <Box sx={{ px: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center' }}>
            <FilterIcon sx={{ color: 'text.disabled', ml: 1, mr: -0.5 }} fontSize="small" />
            <Tabs
              value={tabValue}
              onChange={(e, v) => setTabValue(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ minHeight: 64, '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.95rem' } }}
            >
              <Tab label="Tous" />
              <Tab label={`En attente (${stats.total - stats.confirmed - stats.completed - stats.cancelled})`} />
              <Tab label={`Confirmés (${stats.confirmed})`} />
              <Tab label={`Terminés (${stats.completed})`} />
              <Tab label={`Annulés (${stats.cancelled})`} />
            </Tabs>
          </Box>
        </Paper>

        {/* Content List */}
        {loading ? (
          <Box sx={{ py: 15, textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} />
            <Typography sx={{ mt: 3, fontWeight: 600 }} color="textSecondary">Recherche de vos voyages en cours...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error" variant="filled" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : voyages.length === 0 ? (
          <Paper sx={{ p: { xs: 6, md: 12 }, textAlign: 'center', borderRadius: 6, border: '1px dashed #cbd5e0', bgcolor: 'transparent' }}>
            <Avatar sx={{ width: 100, height: 100, mx: 'auto', mb: 3, bgcolor: '#f1f5f9', color: 'text.disabled' }}>
              <AirplaneIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Typography variant="h4" color="text.primary" fontWeight={800} gutterBottom>Aucun voyage trouvé</Typography>
            <Typography sx={{ mb: 6, fontSize: '1.1rem' }} color="textSecondary">Vous n'avez pas encore de voyage enregistré ou correspondant à ce filtre.</Typography>
            <Button variant="outlined" size="large" onClick={() => window.location.href = '/user/search'} sx={{ px: 6, py: 2, borderRadius: 3, fontWeight: 800 }}>Commencer ma recherche</Button>
          </Paper>
        ) : (
          <Stack spacing={3}>
            {voyages.map(voyage => (
              <VoyageCard
                key={voyage.voyage_id}
                voyage={voyage}
                bagagesByReservationId={bagagesByReservationId}
                onOpenQR={handleOpenQR}
                onCancelCheckin={handleCancelCheckin}
                onDeleteVoyage={handleDeleteVoyage}
              />
            ))}
          </Stack>
        )}

        {/* QR Modal */}
        {qrModalOpen && selectedVoyage && (
          <VoyageQRModal
            voyage={selectedVoyage}
            onClose={() => {
              setQrModalOpen(false);
              setSelectedVoyage(null);
            }}
          />
        )}
      </Container>
    </Box>
  );
};

export default VoyageHistory;
