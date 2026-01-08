import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from '../../context/AuthContext';
import "./User_settings.css";

const UserSettings = () => {
    const { user, logout, updateUser } = useContext(AuthContext);

    // États pour gérer les paramètres utilisateur
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        language: user?.language || 'fr', // Par défaut en français
        darkMode: user?.darkMode || false, // Mode sombre désactivé par défaut
        travelPreferences: user?.travelPreferences || {
            preferredTransport: 'flight', // Transport préféré par défaut
            ecoFriendly: false, // Option éco-responsable
        },
        notificationPreferences: user?.notificationPreferences || {
            email: true, // Notifications par email activées par défaut
            sms: false, // Notifications SMS désactivées par défaut
            push: true, // Notifications push activées par défaut
        },
        privacySettings: user?.privacySettings || {
            showProfile: true, // Profil public par défaut
            shareLocation: false, // Partage de localisation désactivé par défaut
        },
    });

    // Appliquer le mode sombre au chargement du composant
    useEffect(() => {
        if (formData.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [formData.darkMode]);

    // Gestion des changements dans les champs du formulaire
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // Gestion des changements dans les préférences imbriquées (ex : travelPreferences)
    const handleNestedChange = (e, category) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [category]: {
                ...prevState[category],
                [name]: type === 'checkbox' ? checked : value,
            },
        }));
    };

    // Soumission du formulaire
    const handleSubmit = (e) => {
        e.preventDefault();
        updateUser(formData);
        alert('Paramètres mis à jour avec succès !');
    };

    return (
        <div className={`user-settings ${formData.darkMode ? 'dark-mode' : ''}`}>
            <h1>Paramètres Utilisateur</h1>
            <form onSubmit={handleSubmit}>
                {/* Informations personnelles */}
                <fieldset>
                    <legend>Informations Personnelles</legend>
                    <label>
                        Nom :
                        <input type="text" name="name" value={formData.name} onChange={handleChange} />
                    </label>
                    <label>
                        Email :
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </label>
                </fieldset>

                {/* Préférences de langue */}
                <fieldset>
                    <legend>Langue</legend>
                    <label>
                        Langue préférée :
                        <select name="language" value={formData.language} onChange={handleChange}>
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </label>
                </fieldset>

                {/* Mode sombre */}
                <fieldset>
                    <legend>Apparence</legend>
                    <label>
                        <input
                            type="checkbox"
                            name="darkMode"
                            checked={formData.darkMode}
                            onChange={handleChange}
                        />
                        Activer le mode sombre
                    </label>
                </fieldset>

                {/* Préférences de voyage */}
                <fieldset>
                    <legend>Préférences de Voyage</legend>
                    <label>
                        Mode de transport préféré :
                        <select
                            name="preferredTransport"
                            value={formData.travelPreferences.preferredTransport}
                            onChange={(e) => handleNestedChange(e, 'travelPreferences')}
                        >
                            <option value="flight">Avion</option>
                            <option value="train">Train</option>
                            <option value="bus">Bus</option>
                            <option value="car">Voiture</option>
                        </select>
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="ecoFriendly"
                            checked={formData.travelPreferences.ecoFriendly}
                            onChange={(e) => handleNestedChange(e, 'travelPreferences')}
                        />
                        Options éco-responsables
                    </label>
                </fieldset>

                {/* Préférences de notification */}
                <fieldset>
                    <legend>Notifications</legend>
                    <label>
                        <input
                            type="checkbox"
                            name="email"
                            checked={formData.notificationPreferences.email}
                            onChange={(e) => handleNestedChange(e, 'notificationPreferences')}
                        />
                        Recevoir des notifications par email
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="sms"
                            checked={formData.notificationPreferences.sms}
                            onChange={(e) => handleNestedChange(e, 'notificationPreferences')}
                        />
                        Recevoir des notifications par SMS
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="push"
                            checked={formData.notificationPreferences.push}
                            onChange={(e) => handleNestedChange(e, 'notificationPreferences')}
                        />
                        Recevoir des notifications push
                    </label>
                </fieldset>

                {/* Paramètres de confidentialité */}
                <fieldset>
                    <legend>Confidentialité</legend>
                    <label>
                        <input
                            type="checkbox"
                            name="showProfile"
                            checked={formData.privacySettings.showProfile}
                            onChange={(e) => handleNestedChange(e, 'privacySettings')}
                        />
                        Rendre mon profil public
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            name="shareLocation"
                            checked={formData.privacySettings.shareLocation}
                            onChange={(e) => handleNestedChange(e, 'privacySettings')}
                        />
                        Partager ma localisation
                    </label>
                </fieldset>

                <button type="submit">Enregistrer les modifications</button>
            </form>
            <button onClick={logout} className="logout-button">Déconnexion</button>
        </div>
    );
};

export default UserSettings;


  