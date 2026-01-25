import React, { useState } from 'react';
import {
  Box, Container, Card, CardContent, Typography,
  Button, Alert
} from '@mui/material';
import { Flight as FlightIcon, CheckCircle } from '@mui/icons-material';
import { JourneyTimeline } from '../components/shared/JourneyTimeline';

const mockSegments = [
  { transport: 'FLIGHT', departure: 'Paris CDG', destination: 'Lyon', departure_time: '09:00', arrival_time: '10:10', duration: 70, operator: 'Air France' },
  { transport: 'TRAIN', departure: 'Lyon Part-Dieu', destination: 'Marseille', departure_time: '11:00', arrival_time: '13:00', duration: 120, operator: 'SNCF' },
  { transport: 'BUS', departure: 'Marseille', destination: 'Aéroport MRS', departure_time: '13:30', arrival_time: '14:10', duration: 40, operator: 'RTM' },
];

const BoardingGatePage = () => {
  const [boarded, setBoarded] = useState(false);

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          {!boarded ? (
            <>
              <FlightIcon sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
              <Typography variant="h3" gutterBottom>
                ✈️ Porte d'Embarquement
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Veuillez scanner ou appuyer sur le bouton ci-dessous
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<CheckCircle />}
                onClick={() => setBoarded(true)}
                sx={{ px: 6, py: 2 }}
              >
                Confirmer Embarquement
              </Button>
            </>
          ) : (
            <>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 3 }} />
              <Alert severity="success" sx={{ mb: 4, borderRadius: 2 }}>
                <Typography variant="h5">
                  ✅ Embarquement Confirmé !
                </Typography>
                <Typography variant="body1">
                  Bon voyage ! 🎉
                </Typography>
              </Alert>
              <JourneyTimeline segments={mockSegments} currentLeg={3} />
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default BoardingGatePage;
