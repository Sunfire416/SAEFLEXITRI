import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import PMRProfileForm from '../components/PMR/PMRProfileForm';
import './PMRProfilePage.css';

/**
 * Page wrapper pour le formulaire de profil PMR
 * Récupère l'userId du contexte Auth et le passe au composant
 */
const PMRProfilePage = () => {
    const { user } = useContext(AuthContext);

    const handleSave = (profile) => {
        console.log('Profil PMR sauvegardé:', profile);
        // Notification de succès déjà gérée par PMRProfileForm
    };

    return (
        <div className="pmr-profile-page">
            <div className="page-header">
                <h1>Mon Profil PMR</h1>
                <p>Configurez vos besoins d'accessibilité pour des voyages adaptés</p>
            </div>
            
            <PMRProfileForm 
                userId={user?.id} 
                onSave={handleSave}
            />
        </div>
    );
};

export default PMRProfilePage;
