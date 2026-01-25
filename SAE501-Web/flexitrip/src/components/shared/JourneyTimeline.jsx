import React from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Paper,
} from '@mui/material';
import {
  Train as TrainIcon,
  DirectionsBus as BusIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';

const TRANSPORT_ICONS = {
  TRAIN: <TrainIcon />,
  BUS: <BusIcon />,
  FLIGHT: <FlightIcon />,
};

export const JourneyTimeline = ({ segments, currentLeg = 0 }) => {
  return (
    <Stepper activeStep={currentLeg} orientation="vertical">
      {segments.map((segment, i) => (
        <Step key={i}>
          <StepLabel
            icon={TRANSPORT_ICONS[segment.transport]}
            StepIconProps={{
              sx: {
                color: i < currentLeg ? 'success.main' : 
                       i === currentLeg ? 'primary.main' : 'grey.400',
              }
            }}
          >
            <Typography variant="h6">
              {segment.departure} → {segment.destination}
            </Typography>
          </StepLabel>
          <StepContent>
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                🕒 {segment.departure_time} - {segment.arrival_time}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ⏱️ Durée : {segment.duration} min
              </Typography>
              <Typography variant="body2" color="text.secondary">
                🏢 Opérateur : {segment.operator}
              </Typography>
            </Paper>
          </StepContent>
        </Step>
      ))}
    </Stepper>
  );
};
