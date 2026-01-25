import React from 'react';
import { Box, Container, Typography, Paper } from '@mui/material';
import { Explore as ExploreIcon } from '@mui/icons-material';
import MultimodalSearch from "../components/MultimodalSearch/MultimodalSearch";

const HomePage = () => (
  <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
    {/* Hero Section */}
    <Paper 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #2eb378 0%, #5bbcea 100%)',
        color: 'white',
        py: 6,
        px: 3,
        textAlign: 'center',
        borderRadius: 0,
        mb: 4
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <ExploreIcon sx={{ fontSize: 48 }} />
          <Typography variant="h1" component="h1" sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
            FlexiTrip
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ opacity: 0.95, fontWeight: 400 }}>
          Votre assistant de voyage multimodal accessible
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
          🚆 Train • 🚌 Bus • ✈️ Avion • ♿ Accessible PMR
        </Typography>
      </Container>
    </Paper>

    {/* Search Component */}
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <MultimodalSearch />
    </Container>
  </Box>
);

export default HomePage;
