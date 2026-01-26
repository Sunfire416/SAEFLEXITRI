import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  Divider,
  Stack,
  Tabs,
  Tab,
  Avatar,
  Card,
  CardContent,
  useTheme,
  CircularProgress,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  SmartToy as BotIcon,
  Assessment as MonitorIcon,
  Analytics as OverviewIcon,
  People as AgentsIcon,
  Psychology as AlgorithmIcon,
  TrendingUp as StatsIcon,
  CheckCircle as SuccessIcon,
  Error as CriticalIcon,
  Sync as ReassignIcon,
  Engineering as FeatureIcon,
  Speed as ScoreIcon,
  LocationOn as ProximityIcon,
  School as SkillsIcon,
  AccessTime as TimeIcon,
  AssignmentInd as MissionIcon,
  ArrowForwardIos as ArrowIcon,
  Timer as TimerIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const AgentAssignmentPage = () => {
  const theme = useTheme();
  const [statistics, setStatistics] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [monitoringResults, setMonitoringResults] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

  useEffect(() => {
    loadStatistics();
    loadAvailableAgents();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/intelligent-assignment/statistics?period=today`);
      const data = await response.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/intelligent-assignment/available-agents?user_id=1`);
      const data = await response.json();
      if (data.success) {
        setAvailableAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  };

  const handleMonitorMissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/intelligent-assignment/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        setMonitoringResults(data.monitoring);
        await loadStatistics();
      }
    } catch (error) {
      console.error('Erreur monitoring:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      on_mission: 'error',
      busy: 'warning',
      break: 'info',
      off_duty: 'default'
    };
    return colors[status] || 'default';
  };

  if (loading && !statistics) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="textSecondary" sx={{ fontWeight: 600 }}>Initialisation du centre de contrôle IA...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
          <Box>
            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.5rem' }, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
              <BotIcon color="primary" sx={{ fontSize: 45 }} /> Centre d'Assignation IA
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>Pilotage intelligent et monitoring temps réel des agents PMR</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<MonitorIcon />}
            onClick={handleMonitorMissions}
            disabled={loading}
            sx={{
              borderRadius: 4,
              px: 4,
              py: 1.5,
              fontWeight: 900,
              boxShadow: '0 8px 24px rgba(46, 179, 120, 0.2)',
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >Déclencher Monitoring</Button>
        </Box>

        <Paper elevation={0} sx={{ borderRadius: 5, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 4, bgcolor: 'white' }}>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', py: 3, fontSize: '0.95rem' }
            }}
          >
            <Tab icon={<OverviewIcon />} iconPosition="start" label="Tableau de Bord" />
            <Tab icon={<AgentsIcon />} iconPosition="start" label="Gestion des Agents" />
            <Tab icon={<AlgorithmIcon />} iconPosition="start" label="Documentation Algorithme" />
          </Tabs>

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            {/* Vue d'ensemble */}
            {tabValue === 0 && statistics && (
              <Box component="div" sx={{ animation: 'fadeIn 0.4s ease-out' }}>
                <Grid container spacing={3} sx={{ mb: 6 }}>
                  {[
                    { label: 'Missions Totales', value: statistics.missions?.total, icon: <MissionIcon />, color: '#6366f1' },
                    { label: 'Assignées', value: statistics.missions?.assigned, icon: <SuccessIcon />, color: '#2eb378' },
                    { label: 'Critiques', value: statistics.missions?.critical, icon: <CriticalIcon />, color: '#ef4444' },
                    { label: 'Réassignées', value: statistics.missions?.reassigned, icon: <ReassignIcon />, color: '#5bbcea' },
                    { label: 'Agents Actifs', value: statistics.agents?.available, icon: <AgentsIcon />, color: '#f59e0b' },
                    { label: 'Auto-Assignation', value: `${statistics.missions?.assignment_rate}%`, icon: <StatsIcon />, color: '#8b5cf6' }
                  ].map((stat, idx) => (
                    <Grid item xs={6} md={4} lg={2} key={idx}>
                      <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', borderRadius: 4, border: '1px solid #f1f5f9', bgcolor: '#fbfcfe' }}>
                        <Avatar sx={{ bgcolor: `${stat.color}15`, color: stat.color, mx: 'auto', mb: 2, width: 48, height: 48 }}>{stat.icon}</Avatar>
                        <Typography variant="h4" fontWeight={900}>{stat.value}</Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {monitoringResults && (
                  <Alert
                    severity="info"
                    icon={<MonitorIcon />}
                    sx={{ mb: 6, borderRadius: 4, border: '1px solid #bae6fd', bgcolor: '#f0f9ff', '& .MuiAlert-message': { width: '100%' } }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} color="#0369a1" sx={{ mb: 1 }}>Dernier Monitoring : Analyse IA Terminée</Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>SCAN TOTAL</Typography>
                        <Typography variant="h6" fontWeight={800}>{monitoringResults.total}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>PRIORITÉS UPDATED</Typography>
                        <Typography variant="h6" fontWeight={800}>{monitoringResults.priority_changed}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>ACTIONS AUTO</Typography>
                        <Typography variant="h6" fontWeight={800}>{monitoringResults.actions_required}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1' }}>RÉASSIGNATIONS</Typography>
                        <Typography variant="h6" fontWeight={800}>{monitoringResults.reassignments}</Typography>
                      </Grid>
                    </Grid>
                  </Alert>
                )}

                <Typography variant="h5" sx={{ mb: 4, fontWeight: 900 }}>⚡ Capacités Système</Typography>
                <Grid container spacing={4}>
                  {[
                    { title: 'Assignation Multi-Critères', desc: 'Score calculé selon distance, charge et compétences spécifiques au handicap.', icon: <FeatureIcon /> },
                    { title: 'Monitoring Dynamique', desc: 'Détection automatique des retards et réassignation préventive des agents.', icon: <TimerIcon /> },
                    { title: 'Blockchain Security', desc: 'Chaque assignation et validation est certifiée sur le registre décentralisé.', icon: <BotIcon /> }
                  ].map((f, i) => (
                    <Grid item xs={12} md={4} key={i}>
                      <Card elevation={0} sx={{ borderRadius: 5, height: '100%', border: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                        <CardContent sx={{ p: 4 }}>
                          <Avatar sx={{ bgcolor: 'white', color: 'primary.main', mb: 3, boxShadow: theme.shadows[1] }}>{f.icon}</Avatar>
                          <Typography variant="h6" fontWeight={900} gutterBottom>{f.title}</Typography>
                          <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>{f.desc}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Agents Section */}
            {tabValue === 1 && (
              <Box component="div" sx={{ animation: 'fadeIn 0.4s ease-out' }}>
                <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>Équipe d'Intervention ({availableAgents.length})</Typography>
                  <Button variant="outlined" startIcon={<AgentsIcon />} size="small" sx={{ fontWeight: 800 }}>Exporter Logs</Button>
                </Box>

                <Grid container spacing={3}>
                  {availableAgents.slice(0, 12).map((agentData, i) => (
                    <Grid item xs={12} md={6} lg={4} key={i}>
                      <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #f1f5f9', position: 'relative', bgcolor: 'white', '&:hover': { borderColor: 'primary.light', boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }, transition: '0.3s' }}>
                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                          <Chip
                            label={agentData.agent.status.replace('_', ' ')}
                            color={getStatusColor(agentData.agent.status)}
                            size="small"
                            sx={{ fontWeight: 900, textTransform: 'uppercase', fontSize: '0.65rem' }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                          <Avatar sx={{
                            width: 56, height: 56,
                            bgcolor: 'primary.main',
                            fontWeight: 900, fontSize: '1.2rem',
                            boxShadow: '0 4px 12px rgba(46, 179, 120, 0.2)'
                          }}>
                            {agentData.agent.name.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Box sx={{ pt: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={900}>{agentData.agent.name}</Typography>
                            <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, display: 'block' }}>{agentData.agent.entreprise}</Typography>
                          </Box>
                        </Box>

                        <Stack spacing={1.5}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" fontWeight={800} color="textSecondary">SCORE IA OPTIMIZATION</Typography>
                            <Typography variant="caption" fontWeight={900} color="primary.main">{(agentData.score?.totalScore || 0).toFixed(0)}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={agentData.score?.totalScore || 0}
                            sx={{ height: 8, borderRadius: 4, bgcolor: '#f1f5f9' }}
                          />

                          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Tooltip title="Proximité Terrain">
                              <Chip icon={<ProximityIcon fontSize="small" />} label={`${agentData.score?.breakdown?.proximity.toFixed(0)}%`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                            </Tooltip>
                            <Tooltip title="Disponibilité Immédiate">
                              <Chip icon={<TimeIcon fontSize="small" />} label={`${agentData.score?.breakdown?.availability.toFixed(0)}%`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                            </Tooltip>
                          </Box>
                        </Stack>

                        <Divider sx={{ my: 2.5, borderStyle: 'dashed' }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>Contact :</Typography>
                          <IconButton size="small" color="primary" href={`tel:${agentData.agent.phone}`}><SkillsIcon /></IconButton>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Documentation / Algorithm Tab */}
            {tabValue === 2 && (
              <Box component="div" sx={{ animation: 'fadeIn 0.4s ease-out' }}>
                <Typography variant="h4" sx={{ mb: 4, fontWeight: 900 }}>🧠 Algorithme d'Optimisation Multi-Agents</Typography>

                <Paper variant="outlined" sx={{ p: 4, borderRadius: 5, bgcolor: '#f8fafc', mb: 6 }}>
                  <Typography variant="h6" fontWeight={800} gutterBottom color="primary.main">Formule de Scoring IA</Typography>
                  <Paper elevation={0} sx={{ p: 3, bgcolor: '#1e293b', color: 'white', borderRadius: 3, fontFamily: 'monospace', mb: 2 }}>
                    Score = (Dispo × 30%) + (Skills × 25%) + (Géo × 25%) + (Charge × 15%) + (Prio × 5%)
                  </Paper>
                  <Typography variant="body2" color="textSecondary">Cette fonction objective garantit une distribution équitable et efficace des missions pour minimiser le temps d'attente passager.</Typography>
                </Paper>

                <Grid container spacing={4}>
                  {[
                    { title: 'Disponibilité (30%)', items: ['Statut temps réel', 'Charge actuelle', 'Fin de service', 'Temps de repos'], icon: <SuccessIcon /> },
                    { title: 'Compétences (25%)', items: ['Type de handicap', 'Certifications', 'Langues parlées', 'Expertise quai/avion'], icon: <SkillsIcon /> },
                    { title: 'Proximité (25%)', items: ['Distance Haversine', 'Heatmap stations', 'Obstacles accès', 'Temps trajet estimé'], icon: <ProximityIcon /> },
                    { title: 'Charge (15%)', items: ['Équilibre équipe', 'Missions réalisées', 'Stress index', 'Fatigue prédictive'], icon: <ReassignIcon /> }
                  ].map((c, i) => (
                    <Grid item xs={12} md={6} key={i}>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
                        {c.icon} {c.title}
                      </Typography>
                      <List sx={{ bgcolor: 'white', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                        {c.items.map((item, idx) => (
                          <ListItem key={idx} sx={{ borderBottom: idx === c.items.length - 1 ? 0 : '1px solid #f1f5f9' }}>
                            <ListItemIcon sx={{ minWidth: 32 }}><ArrowIcon sx={{ fontSize: 12, color: 'primary.main' }} /></ListItemIcon>
                            <ListItemText primary={item} primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 6 }} />

                <Box sx={{ p: 4, borderRadius: 5, bgcolor: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 900, color: '#991b1b', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <WarningIcon /> Déclencheurs de Réassignation Critique
                  </Typography>
                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    {['Indisponibilité Agent', 'Retard > 30min', 'Incident Bloquant', 'Escalade Manuelle', 'Amélioration Score > 40%'].map((trigger, i) => (
                      <Chip key={i} label={trigger} sx={{ fontWeight: 800, bgcolor: 'white', color: '#991b1b', border: '1px solid #f87171' }} />
                    ))}
                  </Stack>
                </Box>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      <style>
        {` @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } `}
      </style>
    </Box>
  );
};

export default AgentAssignmentPage;
