/**
 * Page Mon Trajet
 * Affiche le parcours multimodal complet avec stepper User Stories
 * Gère les handovers entre agents et la traçabilité
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Grid,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  AccessTime,
  Train,
  DirectionsBus,
  Flight,
  PersonPin,
  NotificationsActive,
  CheckBox
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import { AuthContext } from '../context/AuthContext';
import apiService from '../api/apiService';
import { isDemoMode } from '../config/demoConfig';

const TRANSPORT_ICONS = {
  TRAIN: <Train />,
  BUS: <DirectionsBus />,
  FLIGHT: <Flight />
};

const USER_STORIES = [
  { id: 1, label: 'Réservation multimodale' },
  { id: 2, label: 'Check-in domicile' },
  { id: 3, label: 'Prise en charge gare' },
  { id: 4, label: 'Correspondances' },
  { id: 5, label: 'Sécurité aéroport' },
  { id: 6, label: 'Services supplémentaires' },
  { id: 7, label: 'Gestion exceptions' },
  { id: 8, label: 'Embarquement final' }
];

const MonTrajet = () => {
  const { user } = useContext(AuthContext);
  const [voyage, setVoyage] = useState(null);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [handoverEvents, setHandoverEvents] = useState([]);
  const [agents, setAgents] = useState({});

  // Calculer l'étape active des User Stories
  const calculateActiveStep = () => {
    if (!voyage) return 0;
    const completedSegments = voyage.etapes.filter(e => e.handover_status === 'completed').length;
    
    // Mapping segments → user stories
    if (completedSegments === 0) return 2; // US3: Prise en charge gare
    if (completedSegments === 1) return 3; // US4: Correspondances
    if (completedSegments === 2) return 4; // US5: Sécurité aéroport
    if (completedSegments >= 3) return 7; // US8: Embarquement final
    return 3;
  };

  useEffect(() => {
    loadVoyage();
    loadAgents();
  }, []);

  const loadVoyage = async () => {
    try {
      // Charger le premier voyage actif
      const data = await apiService.get('/voyages/history');
      const voyages = data?.voyages || [];
      
      if (voyages.length > 0) {
        const activeVoyage = voyages[0];
        setVoyage(activeVoyage);
        
        // Trouver l'étape en cours
        const inProgressIndex = activeVoyage.etapes?.findIndex(
          e => e.handover_status !== 'completed'
        );
        setCurrentSegmentIndex(inProgressIndex >= 0 ? inProgressIndex : 0);
      }
    } catch (error) {
      console.error('Erreur chargement voyage:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await apiService.get('/intelligent-assignment/available-agents');
      const agentsList = data?.agents || [];
      
      // Mapper par ID pour faciliter l'accès
      const agentsMap = {};
      agentsList.forEach(agent => {
        agentsMap[agent.id] = agent;
      });
      setAgents(agentsMap);
    } catch (error) {
      console.error('Erreur chargement agents:', error);
    }
  };

  const handleApproaching = async (etapeId) => {
    const event = {
      etape_id: etapeId,
      type: 'APPROACHING',
      timestamp: new Date().toISOString(),
      message: 'J\'approche du point de correspondance'
    };
    
    setHandoverEvents([...handoverEvents, event]);
    
    try {
      await apiService.post(`/prise-en-charge/approaching`, {
        etape_id: etapeId,
        user_id: user?.user_id
      });
    } catch (error) {
      console.error('Erreur notification approche:', error);
    }
  };

  const handleValidateHandover = async (etapeId) => {
    try {
      await apiService.post(`/prise-en-charge/validate`, {
        etape_id: etapeId,
        user_id: user?.user_id
      });
      
      // Mettre à jour le statut local
      const updatedVoyage = { ...voyage };
      const etape = updatedVoyage.etapes.find(e => e.id === etapeId);
      if (etape) {
        etape.handover_status = 'completed';
        setVoyage(updatedVoyage);
        
        // Event de traçabilité
        const event = {
          etape_id: etapeId,
          type: 'HANDOVER_COMPLETED',
          timestamp: new Date().toISOString(),
          message: `Handover validé pour ${etape.compagnie}`
        };
        setHandoverEvents([...handoverEvents, event]);
      }
      
      // Passer au segment suivant
      if (currentSegmentIndex < voyage.etapes.length - 1) {
        setCurrentSegmentIndex(currentSegmentIndex + 1);
      }
    } catch (error) {
      console.error('Erreur validation handover:', error);
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Chargement du trajet...</Typography>
      </Container>
    );
  }

  if (!voyage) {
    return (
      <Box sx={{ bgcolor: '#F6F7F9', minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            Aucun voyage en cours. <a href="/search">Planifier un voyage</a>
          </Alert>
        </Container>
      </Box>
    );
  }

  const currentEtape = voyage.etapes?.[currentSegmentIndex];
  const activeStep = calculateActiveStep();

  return (
    <Box sx={{ bgcolor: '#F6F7F9', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {isDemoMode() && (
          <Alert severity="info" icon={<CheckBox />} sx={{ mb: 3, borderRadius: '12px' }}>
            Mode DEMO activé - Données simulées pour démonstration
          </Alert>
        )}

        {/* En-tête voyage */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: '12px' }}>
          <Typography variant="h4" sx={{ fontFamily: 'Inter', fontWeight: 600, color: '#393839', mb: 2 }}>
            Mon Trajet : {voyage.depart} → {voyage.arrivee}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Date de départ</Typography>
              <Typography variant="h6">
                {new Date(voyage.date_debut).toLocaleDateString('fr-FR', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Statut</Typography>
              <Chip 
                label={voyage.status === 'confirmed' ? 'Confirmé' : voyage.status} 
                color="success" 
                sx={{ borderRadius: '12px' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">Prix total</Typography>
              <Typography variant="h6">{voyage.prix_total || voyage.total_price || '195'} €</Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Stepper User Stories (8 étapes) */}
        <Card sx={{ mb: 3, borderRadius: '12px' }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Inter', fontWeight: 600 }}>
              Progression du parcours
            </Typography>
            <Stepper activeStep={activeStep} alternativeLabel>
              {USER_STORIES.map((us) => (
                <Step key={us.id} completed={activeStep > us.id - 1}>
                  <StepLabel>
                    <Typography variant="caption" sx={{ fontFamily: 'Inter' }}>
                      {us.label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Segments du voyage */}
        <Grid container spacing={3}>
          {voyage.etapes?.map((etape, index) => {
            const isActive = index === currentSegmentIndex;
            const isPast = etape.handover_status === 'completed';
            const agent = agents[etape.agent_id];
            
            return (
              <Grid item xs={12} key={etape.id}>
                <Card 
                  sx={{ 
                    borderRadius: '12px',
                    border: isActive ? '2px solid #5bbcea' : '1px solid #e0e0e0',
                    opacity: isPast ? 0.8 : 1,
                    transition: 'all 0.3s'
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        bgcolor: isActive ? '#2eb378' : isPast ? '#10b981' : '#e0e0e0',
                        color: 'white',
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2
                      }}>
                        {TRANSPORT_ICONS[etape.type] || TRANSPORT_ICONS[etape.transport]}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontFamily: 'Inter', fontWeight: 600 }}>
                          Étape {etape.ordre} : {etape.compagnie}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {etape.adresse_1} → {etape.adresse_2}
                        </Typography>
                      </Box>
                      {isPast && (
                        <CheckCircle sx={{ color: '#10b981', fontSize: 32 }} />
                      )}
                      {isActive && !isPast && (
                        <AccessTime sx={{ color: '#5bbcea', fontSize: 32 }} />
                      )}
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Départ</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {etape.depart_time ? new Date(etape.depart_time).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '--:--'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Arrivée</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {etape.arrivee_time ? new Date(etape.arrivee_time).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '--:--'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Durée</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {etape.duration ? `${etape.duration} min` : '--'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Prix</Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {etape.price ? `${etape.price} €` : '--'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {agent && (
                      <Box sx={{ 
                        bgcolor: '#f6f7f9', 
                        p: 2, 
                        borderRadius: '12px',
                        mb: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PersonPin sx={{ mr: 1, color: '#2eb378' }} />
                          <Typography variant="body2" fontWeight={600}>
                            Agent assigné
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ fontFamily: 'Inter' }}>
                          {agent.surname} {agent.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Spécialité : {agent.specialty} • {agent.phone}
                        </Typography>
                      </Box>
                    )}

                    {isActive && !isPast && (
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<NotificationsActive />}
                          sx={{ 
                            borderRadius: '12px',
                            borderColor: '#5bbcea',
                            color: '#5bbcea',
                            fontFamily: 'Inter',
                            flex: 1,
                            textTransform: 'none',
                            '&:hover': {
                              borderColor: '#3a9dd4',
                              bgcolor: 'rgba(91, 188, 234, 0.04)'
                            }
                          }}
                          onClick={() => handleApproaching(etape.id)}
                        >
                          J'approche
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<CheckCircle />}
                          sx={{ 
                            borderRadius: '12px',
                            bgcolor: '#2eb378',
                            fontFamily: 'Inter',
                            flex: 1,
                            textTransform: 'none',
                            '&:hover': { bgcolor: '#26a06a' }
                          }}
                          onClick={() => handleValidateHandover(etape.id)}
                        >
                          Valider handover
                        </Button>
                      </Box>
                    )}

                    {isPast && (
                      <Alert severity="success" sx={{ borderRadius: '12px' }}>
                        Étape terminée avec succès
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* QR Code du voyage */}
        <Card sx={{ mt: 3, borderRadius: '12px' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Inter', fontWeight: 600 }}>
              QR Code de votre voyage
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Présentez ce code à chaque étape de votre parcours
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <QRCodeSVG 
                value={JSON.stringify({
                  voyage_id: voyage.id_voyage,
                  user_id: user?.user_id,
                  segments: voyage.etapes?.length || 0,
                  departure: voyage.depart,
                  destination: voyage.arrivee
                })}
                size={200}
                level="H"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Log des événements (traçabilité) */}
        {handoverEvents.length > 0 && (
          <Card sx={{ mt: 3, borderRadius: '12px' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Inter', fontWeight: 600 }}>
                Traçabilité des événements
              </Typography>
              {handoverEvents.map((event, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, mb: 1.5, alignItems: 'center' }}>
                  <Chip 
                    label={new Date(event.timestamp).toLocaleTimeString('fr-FR')} 
                    size="small"
                    sx={{ borderRadius: '8px', bgcolor: '#f6f7f9' }}
                  />
                  <Typography variant="body2" sx={{ fontFamily: 'Inter' }}>
                    {event.message}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default MonTrajet;
