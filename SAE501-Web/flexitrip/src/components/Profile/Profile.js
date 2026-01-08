import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './Profile.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

const Profile = () => {
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
        return <p>Chargement...</p>;
    }

    const age = getAge();
    const activeBesoins = getActiveBesoins();

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2 className="profile-title">Votre profil - {user.name} {user.surname}</h2>
                
                {/* Photo de profil */}
                <div className="profile-header">
                    <div className="profile-image-container">
                        <img src={profileImage} alt="Profile" className="profile-image" />
                        <label className="upload-label">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                            <span className="upload-icon">📷</span>
                        </label>
                    </div>
                </div>

                <button
                    onClick={handleImageUpload}
                    className={`btn-update ${isUploading ? 'loading' : ''}`}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <>
                            <span className="spinner"></span> Mise à jour...
                        </>
                    ) : (
                        'Mettre à jour la photo'
                    )}
                </button>

                {/* Informations personnelles */}
                <div className="profile-section">
                    <h3 className="section-title">📋 Informations personnelles</h3>
                    <div className="profile-details">
                        <div className="detail-row">
                            <span className="detail-label">Nom :</span>
                            <span className="detail-value">{user.name}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Prénom :</span>
                            <span className="detail-value">{user.surname}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Date de naissance :</span>
                            <span className="detail-value">{formatDate(user.date_naissance)}</span>
                        </div>
                        {age && (
                            <div className="detail-row">
                                <span className="detail-label">Âge :</span>
                                <span className="detail-value">{age} ans</span>
                            </div>
                        )}
                        <div className="detail-row">
                            <span className="detail-label">Nationalité :</span>
                            <span className="detail-value">{user.nationalite || 'Non renseigné'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Rôle :</span>
                            <span className={`role-badge role-${user.role.toLowerCase()}`}>
                                {user.role}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Coordonnées */}
                <div className="profile-section">
                    <h3 className="section-title">📞 Coordonnées</h3>
                    <div className="profile-details">
                        <div className="detail-row">
                            <span className="detail-label">E-mail :</span>
                            <span className="detail-value">{user.email}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Téléphone :</span>
                            <span className="detail-value">{user.phone || 'Non renseigné'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Adresse :</span>
                            <span className="detail-value">{user.address || 'Non renseignée'}</span>
                        </div>
                    </div>
                </div>

                {/* Informations PMR */}
                {user.role === 'PMR' && (
                    <div className="profile-section pmr-section">
                        <h3 className="section-title">♿ Informations PMR</h3>
                        <div className="profile-details">
                            <div className="detail-row">
                                <span className="detail-label">Type de handicap :</span>
                                <span className="detail-value">
                                    {user.type_handicap || 'Non renseigné'}
                                </span>
                            </div>
                            
                            {activeBesoins.length > 0 && (
                                <div className="detail-row besoins-row">
                                    <span className="detail-label">Besoins spécifiques :</span>
                                    <div className="besoins-list">
                                        {activeBesoins.map((besoin, index) => (
                                            <span key={index} className="besoin-badge">
                                                ✓ {besoin}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Wallet */}
                <div className="profile-section">
                    <h3 className="section-title">💰 Portefeuille</h3>
                    <div className="profile-details">
                        <div className="detail-row">
                            <span className="detail-label">Solde :</span>
                            <span className="detail-value solde">
                                {user.solde ? `${user.solde.toFixed(2)} points` : '0.00 points'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="profile-actions">
                    <Link to="/user/edit-profile" className="btn-edit-profile">
                        ✏️ Modifier le profil
                    </Link>
                    <button onClick={handleDeleteAccount} className="btn-delete-account">
                        🗑️ Supprimer mon compte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;