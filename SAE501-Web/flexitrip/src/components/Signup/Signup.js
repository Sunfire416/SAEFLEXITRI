import { useState } from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import './Signup.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ReactComponent as EyeIcon } from '../../assets/icones/cacher-password.svg';
import PMRInfosForm from '../PMRInfosForm/PMRInfosForm';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

// Liste des pays (les plus courants)
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

function Signup() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        date_naissance: '',
        nationalite: 'France',
        email: '',
        phone: '',
        address: '',
        role: '',
        password: '',
        type_handicap: 'Aucun',
        besoins_specifiques: {}
    });

    const [confirmPassword, setConfirmPassword] = useState('');

    // Validation email
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Calculer l'âge minimum (18 ans)
    const getMaxDate = () => {
        const today = new Date();
        const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        return maxDate.toISOString().split('T')[0];
    };

    // Gestion des changements de champs
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePhoneChange = (value) => {
        setFormData(prev => ({
            ...prev,
            phone: value
        }));
    };

    // Soumission du formulaire
    const registerUser = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        // Validation
        if (!acceptedTerms) {
            setErrorMessage('Vous devez accepter les conditions d\'utilisation.');
            return;
        }

        const { name, surname, email, phone, role, password } = formData;

        if (!name || !surname || !email || !phone || !role || !password) {
            setErrorMessage('Tous les champs obligatoires doivent être remplis.');
            return;
        }

        if (!validateEmail(email)) {
            setErrorMessage('Veuillez entrer une adresse e-mail valide.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 8) {
            setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
            return;
        }

        setLoading(true);

        try {
            // Préparer les données
            const userData = {
                ...formData,
                // Ne pas envoyer type_handicap et besoins_specifiques si rôle n'est pas PMR
                type_handicap: formData.role === 'PMR' ? formData.type_handicap : 'Aucun',
                besoins_specifiques: formData.role === 'PMR' ? formData.besoins_specifiques : {}
            };

            await axios.post(`${API_BASE_URL}/users/insert`, userData);

            setSuccessMessage('Compte créé avec succès ! Redirection...');

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            const serverError = error.response?.data?.error || 'Erreur interne. Veuillez réessayer.';
            setErrorMessage(serverError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-box">
                <h2>Créer votre compte</h2>

                {errorMessage && <div className="error-message">{errorMessage}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <form onSubmit={registerUser}>
                    <div className="form-flex-container">
                        {/* Colonne 1 : Informations personnelles */}
                        <div className="form-column">
                            <h3>Informations personnelles</h3>

                            <div className="input-group">
                                <label>Nom <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Prénom <span className="required">*</span></label>
                                <input
                                    type="text"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Date de naissance</label>
                                <input
                                    type="date"
                                    name="date_naissance"
                                    value={formData.date_naissance}
                                    onChange={handleInputChange}
                                    max={getMaxDate()}
                                />
                                <small className="input-hint">Vous devez avoir au moins 18 ans</small>
                            </div>

                            <div className="input-group">
                                <label>Nationalité</label>
                                <select
                                    name="nationalite"
                                    value={formData.nationalite}
                                    onChange={handleInputChange}
                                >
                                    {PAYS.map(pays => (
                                        <option key={pays} value={pays}>{pays}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Email <span className="required">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Téléphone <span className="required">*</span></label>
                                <PhoneInput
                                    country="fr"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    inputProps={{ required: true }}
                                />
                            </div>

                            <div className="input-group">
                                <label>Adresse</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Colonne 2 : Compte et Sécurité */}
                        <div className="form-column">
                            <h3>Compte et Sécurité</h3>

                            <div className="input-group">
                                <label>Rôle <span className="required">*</span></label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Sélectionnez un rôle</option>
                                    <option value="PMR">PMR (Personne à Mobilité Réduite)</option>
                                    <option value="Accompagnant">Accompagnant</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Mot de passe <span className="required">*</span></label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="password-toggle"
                                    >
                                        {showPassword ? (
                                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M16 8s-3.5-6-8-6-8 6-8 6 3.5 6 8 6 8-6 8-6zM8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                                                <path d="M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                                            </svg>
                                        ) : (
                                            <EyeIcon width="20" height="20" fill="currentColor" />
                                        )}
                                    </button>
                                </div>
                                <small className="input-hint">Minimum 8 caractères</small>
                            </div>

                            <div className="input-group">
                                <label>Confirmer le mot de passe <span className="required">*</span></label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="password-toggle"
                                    >
                                        {showConfirmPassword ? (
                                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                                <path d="M16 8s-3.5-6-8-6-8 6-8 6 3.5 6 8 6 8-6 8-6zM8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                                                <path d="M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                                            </svg>
                                        ) : (
                                            <EyeIcon width="20" height="20" fill="currentColor" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Informations PMR (si rôle = PMR) */}
                            {formData.role === 'PMR' && (
                                <PMRInfosForm formData={formData} setFormData={setFormData} />
                            )}
                        </div>
                    </div>

                    {/* Conditions d'utilisation */}
                    <div className="input-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                required
                            />
                            <span>
                                J'accepte les <a href="/terms" target="_blank" rel="noopener noreferrer">conditions d'utilisation</a> et
                                la <a href="/privacy" target="_blank" rel="noopener noreferrer">politique de confidentialité</a>
                            </span>
                        </label>
                    </div>

                    {/* Bouton de soumission */}
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Création en cours...' : 'Créer mon compte'}
                    </button>
                </form>

                <div className="signup-footer">
                    <p>Vous avez déjà un compte ? <a href="/login">Connectez-vous ici</a></p>
                </div>
            </div>
        </div>
    );
}

export default Signup;