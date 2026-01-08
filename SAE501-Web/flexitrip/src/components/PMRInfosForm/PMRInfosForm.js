import React from 'react';
import './PMRInfosForm.css';

/**
 * Composant réutilisable pour les informations PMR
 * Utilisé dans Signup.js et EditProfil.js
 */
const PMRInfosForm = ({ formData, setFormData }) => {
    
    // Types de handicap disponibles
    const typesHandicap = [
        'Aucun',
        'Fauteuil roulant manuel',
        'Fauteuil roulant électrique',
        'Déficience visuelle',
        'Déficience auditive',
        'Mobilité réduite',
        'Déficience cognitive',
        'Autre'
    ];

    // Besoins spécifiques (conforme au cahier des charges)
    const besoinsOptions = [
        // Assistance aéroportuaire
        { key: 'assistance_aeroport', label: 'Assistance à l\'aéroport', category: 'Aéroport' },
        { key: 'assistance_embarquement', label: 'Assistance à l\'embarquement', category: 'Aéroport' },
        { key: 'assistance_debarquement', label: 'Assistance au débarquement', category: 'Aéroport' },
        
        // Besoins en vol/trajet
        { key: 'siege_adapte', label: 'Siège adapté', category: 'Trajet' },
        { key: 'espace_fauteuil', label: 'Espace pour fauteuil roulant', category: 'Trajet' },
        { key: 'accompagnement_personnel', label: 'Accompagnement personnel', category: 'Trajet' },
        
        // Accessibilité
        { key: 'rampe_acces', label: 'Rampe d\'accès', category: 'Accessibilité' },
        { key: 'ascenseur_requis', label: 'Ascenseur requis', category: 'Accessibilité' },
        { key: 'toilettes_adaptees', label: 'Toilettes adaptées', category: 'Accessibilité' },
        
        // Aide physique
        { key: 'aide_transfert', label: 'Aide au transfert', category: 'Aide physique' },
        { key: 'aide_bagages', label: 'Aide pour les bagages', category: 'Aide physique' },
        { key: 'aide_deplacement', label: 'Aide au déplacement', category: 'Aide physique' },
        
        // Besoins médicaux
        { key: 'oxygene_requis', label: 'Oxygène requis', category: 'Médical' },
        { key: 'equipement_medical', label: 'Équipement médical', category: 'Médical' },
        
        // Besoins sensoriels
        { key: 'assistance_visuelle', label: 'Assistance visuelle', category: 'Sensoriel' },
        { key: 'assistance_auditive', label: 'Assistance auditive', category: 'Sensoriel' },
        
        // Autres
        { key: 'chien_assistance', label: 'Chien d\'assistance', category: 'Autre' }
    ];

    // Grouper par catégorie
    const categories = [...new Set(besoinsOptions.map(b => b.category))];

    const handleTypeHandicapChange = (e) => {
        setFormData(prev => ({
            ...prev,
            type_handicap: e.target.value
        }));
    };

    const handleBesoinChange = (key) => {
        setFormData(prev => ({
            ...prev,
            besoins_specifiques: {
                ...prev.besoins_specifiques,
                [key]: !prev.besoins_specifiques[key]
            }
        }));
    };

    return (
        <div className="pmr-infos-form">
            {/* Type de handicap */}
            <div className="form-section">
                <h3 className="section-title">
                    <span className="icon">♿</span> Type de handicap
                </h3>
                <select
                    name="type_handicap"
                    value={formData.type_handicap || 'Aucun'}
                    onChange={handleTypeHandicapChange}
                    className="form-select"
                >
                    {typesHandicap.map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            {/* Besoins spécifiques */}
            {formData.type_handicap && formData.type_handicap !== 'Aucun' && (
                <div className="form-section">
                    <h3 className="section-title">
                        <span className="icon">✓</span> Besoins spécifiques
                    </h3>
                    <p className="section-subtitle">Sélectionnez tous les besoins qui s'appliquent</p>
                    
                    {categories.map(category => {
                        const categoryOptions = besoinsOptions.filter(b => b.category === category);
                        
                        return (
                            <div key={category} className="besoins-category">
                                <h4 className="category-title">{category}</h4>
                                <div className="checkbox-grid">
                                    {categoryOptions.map(option => (
                                        <label key={option.key} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.besoins_specifiques[option.key] || false}
                                                onChange={() => handleBesoinChange(option.key)}
                                                className="checkbox-input"
                                            />
                                            <span className="checkbox-text">{option.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PMRInfosForm;