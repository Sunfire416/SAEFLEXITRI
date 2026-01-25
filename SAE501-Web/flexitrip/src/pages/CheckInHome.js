import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  CheckCircle as CheckIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';

const CheckInHome = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    address: '',
    cni_photo: null,
    mobility_type: 'wheelchair',
    assistance_needed: true,
    contact_number: ''
  });
  const [photoPreview, setPhotoPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, cni_photo: file });
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('checkin_data', JSON.stringify({
      ...formData,
      cni_photo: photoPreview,
      completed_at: new Date().toISOString()
    }));
    navigate('/user/voyages', { state: { checkInComplete: true } });
  };

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', py: 6 }}>
      <Container maxWidth="md">
        <Card elevation={0} sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <HomeIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              <Box>
                <Typography variant="h3" component="h1">
                  Pré Check-in Départ
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Confirmez vos informations avant le départ
                </Typography>
              </Box>
            </Box>

            <form onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                
                {/* Adresse */}
                <TextField
                  fullWidth
                  label="Adresse de départ"
                  placeholder="123 Rue de Paris, 75001 Paris"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: <HomeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                {/* Type mobilité */}
                <FormControl fullWidth required>
                  <InputLabel>Type de mobilité</InputLabel>
                  <Select
                    value={formData.mobility_type}
                    onChange={(e) => setFormData({ ...formData, mobility_type: e.target.value })}
                    label="Type de mobilité"
                  >
                    <MenuItem value="wheelchair">♿ Fauteuil roulant électrique</MenuItem>
                    <MenuItem value="wheelchair-manual">♿ Fauteuil roulant manuel</MenuItem>
                    <MenuItem value="crutches">🦯 Béquilles</MenuItem>
                    <MenuItem value="blind">👁️ Malvoyant/Aveugle</MenuItem>
                    <MenuItem value="deaf">👂 Malentendant/Sourd</MenuItem>
                    <MenuItem value="none">✅ Aucun besoin spécifique</MenuItem>
                  </Select>
                </FormControl>

                {/* Upload CNI */}
                <Box>
                  <Typography variant="body1" fontWeight={600} gutterBottom>
                    🆔 Pièce d'identité (CNI/Passeport)
                  </Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    startIcon={<UploadIcon />}
                    sx={{ height: 56, justifyContent: 'flex-start', px: 2 }}
                  >
                    {formData.cni_photo ? '✅ Photo chargée' : 'Télécharger CNI/Passeport'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                    />
                  </Button>
                  {photoPreview && (
                    <Card sx={{ mt: 2, border: '2px solid', borderColor: 'success.main' }}>
                      <img
                        src={photoPreview}
                        alt="Preview CNI"
                        style={{ width: '100%', maxHeight: 300, objectFit: 'contain' }}
                      />
                    </Card>
                  )}
                </Box>

                {/* Assistance */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.assistance_needed}
                      onChange={(e) => setFormData({ ...formData, assistance_needed: e.target.checked })}
                      sx={{ color: 'primary.main' }}
                    />
                  }
                  label="J'ai besoin d'une assistance PMR"
                />

                {/* Téléphone */}
                <TextField
                  fullWidth
                  type="tel"
                  label="Téléphone de contact"
                  placeholder="+33 6 00 00 00 00"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />

                {/* Submit */}
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<CheckIcon />}
                  sx={{ mt: 2, py: 1.5 }}
                >
                  Confirmer le départ
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>

        <Alert severity="info" sx={{ borderRadius: 2 }}>
          ℹ️ Vos informations sont sécurisées et utilisées uniquement pour votre voyage
        </Alert>
      </Container>
    </Box>
  );
};

export default CheckInHome;
