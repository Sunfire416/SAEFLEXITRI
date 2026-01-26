import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Avatar,
    IconButton,
    Button,
    Grid,
    Chip,
    Divider,
    CircularProgress,
    useTheme
} from '@mui/material';
import {
    PhotoCamera as PhotoCameraIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Person as PersonIcon,
    ContactPhone as ContactPhoneIcon,
    Accessible as AccessibleIcon,
    AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

const Profile = () => {
    const theme = useTheme();
    const { user, updateUserProfile } = useContext(AuthContext);
    const [profileImage, setProfileImage] = useState(() => {
        const userId = user?.user_id || 'guest';
        const storedImage = localStorage.getItem(`profileImage_${userId}`);
        return storedImage || user?.profilePicture || '/default-profile.png';
    });
    const [selectedImage, setSelectedImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        const userId = user?.user_id || 'guest';
        const storedImage = localStorage.getItem(`profileImage_${userId}`);
        if (storedImage) {
            setProfileImage(storedImage);
        } else if (user?.profilePicture) {
            setProfileImage(user.profilePicture);
        }
    }, [user]);

    // Calculer l'âge
    const getAge = () => {
        if (!user?.date_naissance) return null;
        const today = new Date();
        const birthDate = new Date(user.date_naissance);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Non renseigné';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Obtenir les besoins spécifiques actifs
    const getActiveBesoins = () => {
        if (!user?.besoins_specifiques || typeof user.besoins_specifiques !== 'object') {
            return [];
        }
        return Object.entries(user.besoins_specifiques)
            .filter(([key, value]) => value === true)
            .map(([key]) => {
                // Convertir snake_case en texte lisible
                return key.split('_').map(word =>
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
            });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageBase64 = event.target.result;
                const userId = user?.user_id || 'guest';
                const storageKey = `profileImage_${userId}`;

                setProfileImage(imageBase64);
                localStorage.setItem(storageKey, imageBase64);
                setSelectedImage(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedImage) {
            alert('Veuillez sélectionner une image.');
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedImage);

            const response = await fetch(`${API_BASE_URL}/users/update/${user.user_id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Erreur lors du téléchargement de l'image.");
            }

            const data = await response.json();
            await updateUserProfile({ profilePicture: data.profilePicture });

            setProfileImage(data.profilePicture);
            localStorage.setItem(`profileImage_${user.user_id}`, data.profilePicture);

            alert('Image de profil mise à jour avec succès !');
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'image :", error);
            alert("Erreur lors de la mise à jour. Veuillez réessayer.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
            return;
        }

        try {
            const userId = user?.user_id;
            if (!userId) {
                throw new Error("ID utilisateur non trouvé.");
            }

            const response = await fetch(`${API_BASE_URL}/users/delete/${userId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                alert('Votre compte a été supprimé avec succès.');
                localStorage.removeItem('token');
                window.location.href = '/';
            } else {
                const errorData = await response.json();
                alert(`Erreur : ${errorData.error || 'Impossible de supprimer le compte.'}`);
            }
        } catch (error) {
            console.error("Erreur lors de la suppression du compte :", error);
            alert("Une erreur est survenue lors de la suppression du compte. Veuillez réessayer.");
        }
    };

    if (!user) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    const age = getAge();
    const activeBesoins = getActiveBesoins();

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 6 }}>
            <Container maxWidth="md">
                <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
                    <Typography variant="h2" component="h2" sx={{ mb: 4, textAlign: 'center', color: 'text.primary' }}>
                        Votre profil - {user.name} {user.surname}
                    </Typography>

                    {/* Photo de profil */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 5 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={profileImage}
                                alt="Profile"
                                sx={{
                                    width: 150,
                                    height: 150,
                                    border: `5px solid ${theme.palette.secondary.main}`,
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                                }}
                            />
                            <IconButton
                                component="label"
                                sx={{
                                    position: 'absolute',
                                    bottom: 5,
                                    right: 5,
                                    backgroundColor: 'secondary.main',
                                    color: 'white',
                                    '&:hover': { backgroundColor: 'secondary.dark' },
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                                }}
                            >
                                <input
                                    type="file"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <PhotoCameraIcon />
                            </IconButton>
                        </Box>
                        {selectedImage && (
                            <Button
                                onClick={handleImageUpload}
                                variant="contained"
                                color="secondary"
                                disabled={isUploading}
                                sx={{ mt: 2, borderRadius: 3 }}
                                startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
                            >
                                {isUploading ? 'Mise à jour...' : 'Confirmer la photo'}
                            </Button>
                        )}
                    </Box>

                    {/* Informations personnelles */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                            <PersonIcon color="primary" />
                            <Typography variant="h3">Informations personnelles</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Nom</Typography>
                                    <Typography variant="body1" fontWeight={600}>{user.name}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Prénom</Typography>
                                    <Typography variant="body1" fontWeight={600}>{user.surname}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Date de naissance</Typography>
                                    <Typography variant="body1" fontWeight={600}>{formatDate(user.date_naissance)}</Typography>
                                </Paper>
                            </Grid>
                            {age && (
                                <Grid item xs={12} sm={6}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Âge</Typography>
                                        <Typography variant="body1" fontWeight={600}>{age} ans</Typography>
                                    </Paper>
                                </Grid>
                            )}
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Nationalité</Typography>
                                    <Typography variant="body1" fontWeight={600}>{user.nationalite || 'Non renseigné'}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Rôle</Typography>
                                    <Chip
                                        label={user.role}
                                        color={user.role === 'PMR' ? 'primary' : 'secondary'}
                                        size="small"
                                        sx={{ fontWeight: 700 }}
                                    />
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ my: 4 }} />

                    {/* Coordonnées */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                            <ContactPhoneIcon color="primary" />
                            <Typography variant="h3">Coordonnées</Typography>
                        </Box>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>E-mail</Typography>
                                    <Typography variant="body1" fontWeight={600}>{user.email}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Téléphone</Typography>
                                    <Typography variant="body1" fontWeight={600}>{user.phone || 'Non renseigné'}</Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Adresse</Typography>
                                    <Typography variant="body1" fontWeight={600}>{user.address || 'Non renseignée'}</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Informations PMR */}
                    {user.role === 'PMR' && (
                        <>
                            <Divider sx={{ my: 4 }} />
                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                                    <AccessibleIcon color="primary" />
                                    <Typography variant="h3">Informations PMR</Typography>
                                </Box>
                                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: '#eff6ff', borderColor: '#bfdbfe' }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Type de handicap</Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ mb: 3 }}>{user.type_handicap || 'Non renseigné'}</Typography>

                                    {activeBesoins.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary' }}>Besoins spécifiques</Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {activeBesoins.map((besoin, index) => (
                                                    <Chip key={index} label={`✓ ${besoin}`} variant="contained" color="secondary" size="small" />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Paper>
                            </Box>
                        </>
                    )}

                    <Divider sx={{ my: 4 }} />

                    {/* Wallet */}
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                            <WalletIcon color="primary" />
                            <Typography variant="h3">Portefeuille</Typography>
                        </Box>
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 3,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                bgcolor: '#f0fdf4',
                                border: '1px solid #10b981'
                            }}
                        >
                            <Typography variant="body1" fontWeight={500}>Solde disponible</Typography>
                            <Typography variant="h4" color="#059669" fontWeight={700}>
                                {user.solde ? `${user.solde.toFixed(2)} points` : '0.00 points'}
                            </Typography>
                        </Paper>
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <Button
                            component={Link}
                            to="/user/edit-profile"
                            variant="contained"
                            color="secondary"
                            fullWidth
                            startIcon={<EditIcon />}
                            sx={{ py: 1.5, fontSize: '1.1rem' }}
                        >
                            Modifier le profil
                        </Button>
                        <Button
                            onClick={handleDeleteAccount}
                            variant="outlined"
                            color="error"
                            fullWidth
                            startIcon={<DeleteIcon />}
                            sx={{ py: 1.5, fontSize: '1.1rem' }}
                        >
                            Supprimer mon compte
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Profile;
