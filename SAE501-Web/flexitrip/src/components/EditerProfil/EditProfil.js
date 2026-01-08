import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import PMRInfosForm from '../PMRInfosForm/PMRInfosForm';
import './EditProfil.css';

// Liste des pays
const PAYS = [
    'Afghanistan', 'Albanie', 'Algérie', 'Allemagne', 'Andorre', 'Angola', 'Arabie Saoudite',
    'Argentine', 'Arménie', 'Australie', 'Autriche', 'Azerbaïdjan', 'Bahamas', 'Bahreïn',
    'Bangladesh', 'Barbade', 'Belgique', 'Belize', 'Bénin', 'Bhoutan', 'Biélorussie',
    'Birmanie', 'Bolivie', 'Bosnie-Herzégovine', 'Botswana', 'Brésil', 'Brunei', 'Bulgarie',
    'Burkina Faso', 'Burundi', 'Cambodge', 'Cameroun', 'Canada', 'Cap-Vert', 'Chili', 'Chine',
    'Chypre', 'Colombie', 'Comores', 'Congo', 'Corée du Nord', 'Corée du Sud', 'Costa Rica',
    'Côte d\'Ivoire', 'Croatie', 'Cuba', 'Danemark', 'Djibouti', 'Dominique', 'Égypte',
    'Émirats arabes unis', 'Équateur', 'Érythrée', 'Espagne', 'Estonie', 'Eswatini', 'États-Unis',
    'Éthiopie', 'Fidji', 'Finlande', 'France', 'Gabon', 'Gambie', 'Géorgie', 'Ghana', 'Grèce',
    'Grenade', 'Guatemala', 'Guinée', 'Guinée équatoriale', 'Guinée-Bissau', 'Guyana', 'Haïti',
    'Honduras', 'Hongrie', 'Inde', 'Indonésie', 'Irak', 'Iran', 'Irlande', 'Islande', 'Israël',
    'Italie', 'Jamaïque', 'Japon', 'Jordanie', 'Kazakhstan', 'Kenya', 'Kirghizistan', 'Kiribati',
    'Koweït', 'Laos', 'Lesotho', 'Lettonie', 'Liban', 'Liberia', 'Libye', 'Liechtenstein',
    'Lituanie', 'Luxembourg', 'Macédoine du Nord', 'Madagascar', 'Malaisie', 'Malawi', 'Maldives',
    'Mali', 'Malte', 'Maroc', 'Maurice', 'Mauritanie', 'Mexique', 'Micronésie', 'Moldavie',
    'Monaco', 'Mongolie', 'Monténégro', 'Mozambique', 'Namibie', 'Nauru', 'Népal', 'Nicaragua',
    'Niger', 'Nigeria', 'Norvège', 'Nouvelle-Zélande', 'Oman', 'Ouganda', 'Ouzbékistan',
    'Pakistan', 'Palaos', 'Palestine', 'Panama', 'Papouasie-Nouvelle-Guinée', 'Paraguay',
    'Pays-Bas', 'Pérou', 'Philippines', 'Pologne', 'Portugal', 'Qatar', 'République centrafricaine',
    'République démocratique du Congo', 'République dominicaine', 'République tchèque', 'Roumanie',
    'Royaume-Uni', 'Russie', 'Rwanda', 'Saint-Kitts-et-Nevis', 'Saint-Vincent-et-les-Grenadines',
    'Sainte-Lucie', 'Saint-Marin', 'Salomon', 'Salvador', 'Samoa', 'São Tomé-et-Principe',
    'Sénégal', 'Serbie', 'Seychelles', 'Sierra Leone', 'Singapour', 'Slovaquie', 'Slovénie',
    'Somalie', 'Soudan', 'Soudan du Sud', 'Sri Lanka', 'Suède', 'Suisse', 'Suriname', 'Syrie',
    'Tadjikistan', 'Tanzanie', 'Tchad', 'Thaïlande', 'Timor oriental', 'Togo', 'Tonga',
    'Trinité-et-Tobago', 'Tunisie', 'Turkménistan', 'Turquie', 'Tuvalu', 'Ukraine', 'Uruguay',
    'Vanuatu', 'Vatican', 'Venezuela', 'Viêt Nam', 'Yémen', 'Zambie', 'Zimbabwe'
];

const EditUser = () => {
    const { user, updateUserProfile } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const [userInfo, setUserInfo] = useState({
        user_id: user?.user_id || '',
        name: user?.name || '',
        surname: user?.surname || '',
        date_naissance: user?.date_naissance || '',
        nationalite: user?.nationalite || 'France',
        phone: user?.phone || '',
        address: user?.address || '',
        role: user?.role || '',
        type_handicap: user?.type_handicap || 'Aucun',
        besoins_specifiques: user?.besoins_specifiques || {}
    });

    useEffect(() => {
        if (user) {
            setUserInfo({
                user_id: user.user_id || '',
                name: user.name || '',
                surname: user.surname || '',
                date_naissance: user.date_naissance || '',
                nationalite: user.nationalite || 'France',
                phone: user.phone || '',
                address: user.address || '',
                role: user.role || '',
                type_handicap: user.type_handicap || 'Aucun',
                besoins_specifiques: user.besoins_specifiques || {}
            });
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhoneChange = (value) => {
        setUserInfo(prev => ({
            ...prev,
            phone: value
        }));
    };

    const validateInputs = () => {
        if (!userInfo.name || !userInfo.surname || !userInfo.email || !userInfo.phone) {
            setErrorMessage('Les champs nom, prénom, email et téléphone sont obligatoires.');
            return false;
        }

        if (userInfo.phone && userInfo.phone.length < 10) {
            setErrorMessage('Veuillez entrer un numéro de téléphone valide.');
            return false;
        }

        return true;
    };

    const handleSaveChanges = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (!validateInputs()) return;

        setIsSaving(true);

        try {
            // Préparer les données (ne pas envoyer les infos PMR si le rôle n'est pas PMR)
            const dataToUpdate = {
                ...userInfo,
                type_handicap: userInfo.role === 'PMR' ? userInfo.type_handicap : 'Aucun',
                besoins_specifiques: userInfo.role === 'PMR' ? userInfo.besoins_specifiques : {}
            };

            await updateUserProfile(dataToUpdate);

            setSuccessMessage('Profil mis à jour avec succès !');
            
            setTimeout(() => {
                navigate('/user/profile');
            }, 1500);

        } catch (error) {
            setErrorMessage(`Erreur : ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return <p>Chargement...</p>;
    }

    return (
        <div className="edit-user-container">
            <div className="edit-user-box">
                <h1 className="edit-user-title">Modifier le profil</h1>

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <form className="edit-user-form" onSubmit={handleSaveChanges}>
                    {/* Informations personnelles */}
                    <div className="form-section">
                        <h3 className="section-title">📋 Informations personnelles</h3>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="name">Nom <span className="required">*</span></label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={userInfo.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="surname">Prénom <span className="required">*</span></label>
                                <input
                                    type="text"
                                    id="surname"
                                    name="surname"
                                    value={userInfo.surname}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="date_naissance">Date de naissance</label>
                                <input
                                    type="date"
                                    id="date_naissance"
                                    name="date_naissance"
                                    value={userInfo.date_naissance}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="nationalite">Nationalité</label>
                                <select
                                    id="nationalite"
                                    name="nationalite"
                                    value={userInfo.nationalite}
                                    onChange={handleInputChange}
                                >
                                    {PAYS.map(pays => (
                                        <option key={pays} value={pays}>{pays}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Coordonnées */}
                    <div className="form-section">
                        <h3 className="section-title">📞 Coordonnées</h3>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="phone">Téléphone <span className="required">*</span></label>
                                <PhoneInput
                                    country="fr"
                                    value={userInfo.phone}
                                    onChange={handlePhoneChange}
                                    inputProps={{ required: true }}
                                />
                            </div>

                            <div className="form-group full-width">
                                <label htmlFor="address">Adresse</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    value={userInfo.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Informations PMR */}
                    {userInfo.role === 'PMR' && (
                        <div className="form-section pmr-section">
                            <h3 className="section-title">♿ Informations PMR</h3>
                            <PMRInfosForm formData={userInfo} setFormData={setUserInfo} />
                        </div>
                    )}

                    {/* Boutons d'action */}
                    <div className="form-actions">
                        <button
                            type="submit"
                            className={`btn-save ${isSaving ? 'loading' : ''}`}
                            disabled={isSaving}
                        >
                            {isSaving ? '⏳ Enregistrement...' : '💾 Enregistrer les modifications'}
                        </button>
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => navigate('/user/profile')}
                            disabled={isSaving}
                        >
                            ← Retour au profil
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUser;