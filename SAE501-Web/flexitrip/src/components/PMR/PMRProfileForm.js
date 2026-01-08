import React, { useState, useEffect } from 'react';
import './PMRProfileForm.css';

/**
 * Formulaire de profil PMR détaillé
 * Permet de configurer tous les besoins d'accessibilité
 */
const PMRProfileForm = ({ userId, initialProfile = {}, onSave }) => {
    const [profile, setProfile] = useState({
        mobility_aid: initialProfile.mobility_aid || 'none',
        wheelchair_type: initialProfile.wheelchair_type || null,
        visual_impairment: initialProfile.visual_impairment || false,
        hearing_impairment: initialProfile.hearing_impairment || false,
        cognitive_assistance_needed: initialProfile.cognitive_assistance_needed || false,
        service_dog: initialProfile.service_dog || false,
        preferred_seat: initialProfile.preferred_seat || 'aisle',
        assistance_level: initialProfile.assistance_level || 'partial',
        language_preference: initialProfile.language_preference || 'fr',
        emergency_contact: initialProfile.emergency_contact || {
            name: '',
            phone: '',
            relationship: ''
        },
        medical_info: initialProfile.medical_info || '',
        special_equipment_needed: initialProfile.special_equipment_needed || []
    });

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    const handleInputChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEmergencyContactChange = (field, value) => {
        setProfile(prev => ({
            ...prev,
            emergency_contact: {
                ...prev.emergency_contact,
                [field]: value
            }
        }));
    };

    const handleEquipmentToggle = (equipment) => {
        setProfile(prev => {
            const current = prev.special_equipment_needed;
            const updated = current.includes(equipment)
                ? current.filter(e => e !== equipment)
                : [...current, equipment];
            
            return {
                ...prev,
                special_equipment_needed: updated
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/users/${userId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pmr_profile: profile
                })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: '✅ Profil PMR mis à jour avec succès' });
                if (onSave) onSave(profile);
            } else {
                setMessage({ type: 'error', text: '❌ Erreur lors de la sauvegarde' });
            }
        } catch (error) {
            console.error('Erreur sauvegarde profil PMR:', error);
            setMessage({ type: 'error', text: '❌ Erreur réseau' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="pmr-profile-form">
            <h2>🦽 Mon Profil PMR</h2>
            <p className="form-description">
                Ces informations nous permettent d'adapter l'assistance à vos besoins spécifiques.
            </p>

            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Aide à la mobilité */}
                <div className="form-section">
                    <h3>🚶 Aide à la mobilité</h3>
                    
                    <div className="form-group">
                        <label>Type d'aide à la mobilité</label>
                        <select
                            value={profile.mobility_aid}
                            onChange={(e) => handleInputChange('mobility_aid', e.target.value)}
                        >
                            <option value="none">Aucune</option>
                            <option value="cane">Canne</option>
                            <option value="walker">Déambulateur</option>
                            <option value="wheelchair">Fauteuil roulant</option>
                        </select>
                    </div>

                    {profile.mobility_aid === 'wheelchair' && (
                        <div className="form-group">
                            <label>Type de fauteuil roulant</label>
                            <select
                                value={profile.wheelchair_type || ''}
                                onChange={(e) => handleInputChange('wheelchair_type', e.target.value)}
                            >
                                <option value="">Sélectionner...</option>
                                <option value="manual">Manuel</option>
                                <option value="electric">Électrique</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Déficiences sensorielles */}
                <div className="form-section">
                    <h3>👁️ Déficiences sensorielles</h3>
                    
                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={profile.visual_impairment}
                                onChange={(e) => handleInputChange('visual_impairment', e.target.checked)}
                            />
                            <span>Déficience visuelle</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={profile.hearing_impairment}
                                onChange={(e) => handleInputChange('hearing_impairment', e.target.checked)}
                            />
                            <span>Déficience auditive</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={profile.cognitive_assistance_needed}
                                onChange={(e) => handleInputChange('cognitive_assistance_needed', e.target.checked)}
                            />
                            <span>Besoin d'assistance cognitive</span>
                        </label>

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={profile.service_dog}
                                onChange={(e) => handleInputChange('service_dog', e.target.checked)}
                            />
                            <span>Chien d'assistance</span>
                        </label>
                    </div>
                </div>

                {/* Préférences */}
                <div className="form-section">
                    <h3>⚙️ Préférences</h3>
                    
                    <div className="form-group">
                        <label>Siège préféré</label>
                        <select
                            value={profile.preferred_seat}
                            onChange={(e) => handleInputChange('preferred_seat', e.target.value)}
                        >
                            <option value="aisle">Couloir</option>
                            <option value="window">Fenêtre</option>
                            <option value="first_row">Premier rang</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Niveau d'assistance</label>
                        <select
                            value={profile.assistance_level}
                            onChange={(e) => handleInputChange('assistance_level', e.target.value)}
                        >
                            <option value="minimal">Minimale (je suis autonome)</option>
                            <option value="partial">Partielle (aide ponctuelle)</option>
                            <option value="full">Complète (accompagnement permanent)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Langue préférée</label>
                        <select
                            value={profile.language_preference}
                            onChange={(e) => handleInputChange('language_preference', e.target.value)}
                        >
                            <option value="fr">Français</option>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                        </select>
                    </div>
                </div>

                {/* Équipements spéciaux */}
                <div className="form-section">
                    <h3>🛠️ Équipements spéciaux nécessaires</h3>
                    
                    <div className="checkbox-group">
                        {['rampe', 'fauteuil_transfert', 'oxygen', 'planche_transfert', 'aide_auditive'].map(equip => (
                            <label key={equip} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={profile.special_equipment_needed.includes(equip)}
                                    onChange={() => handleEquipmentToggle(equip)}
                                />
                                <span>{formatEquipmentName(equip)}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Contact d'urgence */}
                <div className="form-section">
                    <h3>📞 Contact d'urgence</h3>
                    
                    <div className="form-group">
                        <label>Nom</label>
                        <input
                            type="text"
                            value={profile.emergency_contact.name}
                            onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                            placeholder="Nom du contact"
                        />
                    </div>

                    <div className="form-group">
                        <label>Téléphone</label>
                        <input
                            type="tel"
                            value={profile.emergency_contact.phone}
                            onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                        />
                    </div>

                    <div className="form-group">
                        <label>Lien de parenté</label>
                        <input
                            type="text"
                            value={profile.emergency_contact.relationship}
                            onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                            placeholder="Ex: Conjoint, Parent, Ami..."
                        />
                    </div>
                </div>

                {/* Informations médicales */}
                <div className="form-section">
                    <h3>🏥 Informations médicales</h3>
                    
                    <div className="form-group">
                        <label>Informations médicales à communiquer aux agents (optionnel)</label>
                        <textarea
                            value={profile.medical_info}
                            onChange={(e) => handleInputChange('medical_info', e.target.value)}
                            placeholder="Allergies, médications, précautions particulières..."
                            rows={4}
                        />
                        <small>Ces informations seront partagées uniquement avec les agents PMR assignés.</small>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={saving}>
                        {saving ? 'Sauvegarde...' : '💾 Sauvegarder mon profil'}
                    </button>
                </div>
            </form>
        </div>
    );
};

function formatEquipmentName(equip) {
    const names = {
        'rampe': 'Rampe d\'accès',
        'fauteuil_transfert': 'Fauteuil de transfert',
        'oxygen': 'Oxygène',
        'planche_transfert': 'Planche de transfert',
        'aide_auditive': 'Aide auditive'
    };
    return names[equip] || equip;
}

export default PMRProfileForm;
