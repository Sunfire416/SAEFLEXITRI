/* src/components/Navbar/Navbar.js */

import React, { useState, useEffect, useContext } from 'react';
import './Navbar.css';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/images/Flexitrip.png';
import defaultProfileImage from '../../assets/images/younes.png'; // Image par défaut
import { AuthContext } from '../../context/AuthContext';
import { ReactComponent as SettingsIcon } from '../../assets/icones/settings.svg';
import { ReactComponent as UserIcon } from '../../assets/icones/utilisateur.svg';
import { ReactComponent as LogoutIcon } from '../../assets/icones/logout.svg';
import { ReactComponent as AngleDownIcon } from '../../assets/icones/angle-bas.svg';
import { ReactComponent as AngleRightIcon } from '../../assets/icones/angle-droit.svg';
import NotificationBell from '../Notifications/NotificationBell';
//import { ReactComponent as MoonIcon } from '../../assets/icones/moon.svg'; // Icône pour le mode sombre
//import { ReactComponent as SunIcon } from '../../assets/icones/sun.svg'; // Icône pour le mode clair


function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // État pour le menu mobile
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(() => {
        // Charge l'image depuis le localStorage, ou utilise l'image par défaut
        return localStorage.getItem('profileImage') || user?.profilePicture || defaultProfileImage;
    });

    
    

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen); // Ouvrir/fermer le menu déroulant
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const imageBase64 = event.target.result; // Convertir en base64
                const userId = user?.id || "guest"; // Utiliser l'ID utilisateur ou "guest" si non connecté
                const storageKey = `profileImage_${userId}`; // Générer une clé unique

                setProfileImage(imageBase64); // Mettre à jour l'image localement
                localStorage.setItem(storageKey, imageBase64); // Stocker dans localStorage avec une clé unique
            };
            reader.readAsDataURL(file);
        }
    };

    // Charger l'image de profil au démarrage
    useEffect(() => {
        const userId = user?.id || "guest"; // Utiliser l'ID utilisateur ou "guest" si non connecté
        const storageKey = `profileImage_${userId}`; // Générer une clé unique
        const storedImage = localStorage.getItem(storageKey); // Récupérer l'image de localStorage
        if (storedImage) {
            setProfileImage(storedImage); // Mettre à jour l'image si elle existe
        }
    }, [user]); // Exécuter à chaque fois que l'utilisateur change

    useEffect(() => {
        const handleScroll = () => {
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('sticky');
            } else {
                navbar.classList.remove('sticky');
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const existingScript = document.querySelector('script[src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"]');

        if (!existingScript) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            document.body.appendChild(script);

            window.googleTranslateElementInit = () => {
                new window.google.translate.TranslateElement({ pageLanguage: 'fr' }, 'google_translate_element');
            };
        }
    }, []);
    

    // Assurer la navigation vers les routes utilisateur sans forcer /user/home
    useEffect(() => {
        if (user && location.pathname === '/') {
            navigate('/user/home');
        }
    }, [user, navigate, location.pathname]);

    // Gestion de la déconnexion
    const handleLogout = () => {
        logout();
        navigate('/login'); // Redirige vers /login après déconnexion
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <a href="/" className="navbar-logo">
                    <img src={logo} alt="FlexiTrip" className="navbar-logo-img" />
                </a>
                <ul className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
                    {/* Routes publiques */}
                    {!user && (
                        <>
                            <li className="nav-item">
                                <a href="/login" className="nav-links">Connexion</a>
                            </li>
                        </>
                    )}

                    {/* Routes protégées */}
                    {user && (
                        <>
                            <li className="nav-item">
                                <a href="/user/home" className="nav-links">🏠 Accueil</a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/voyages" className="nav-links">✈️ Mes Voyages</a>
                            </li>
                            {(user.role === 'PMR' || user.role === 'Accompagnant') && (
                                <li className="nav-item">
                                    <a href="/user/bagages" className="nav-links">🧳 Mes bagages</a>
                                </li>
                            )}
                            <li className="nav-item">
                                <a href="/user/checkin" className="nav-links">📋 Check-in</a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/boarding" className="nav-links">🎫 Boarding Pass</a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/boarding-gate" className="nav-links">🚪 Porte Embarquement</a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/ewallet" className="nav-links">💰 Wallet</a>
                            </li>
                        </>
                    )}
                </ul>

                {/* User Section */}
                {user ? (
                    <div className="user-info">
                        <img
                            src={profileImage}
                            alt="User Profile"
                            className="profile-pic"
                        />
                        <span>{user.name}</span>
                        <span>{user.role}</span>
                        {/* 🆕 Notification Bell */}
                        <NotificationBell />
                        <AngleDownIcon className="icon" onClick={toggleDropdown} />

                        {/* Dropdown Menu */}
                        {dropdownOpen && (
                            <div className="user-dropdown">
                                <a href="/user/profile">👤 Profil <AngleRightIcon className="icon-Drop" /></a>
                                <a href="/user/settings">⚙️ Paramètres <AngleRightIcon className="icon-Drop" /></a>
                                <a href="/user/notifications">📬 Notifications <AngleRightIcon className="icon-Drop" /></a>
                                <a href="/user/voyages">✈️ Mes Voyages <AngleRightIcon className="icon-Drop" /></a>
                                {(user.role === 'PMR' || user.role === 'Accompagnant') && (
                                    <a href="/user/bagages">🧳 Mes bagages <AngleRightIcon className="icon-Drop" /></a>
                                )}
                                <a href="/user/checkin">📋 Check-in <AngleRightIcon className="icon-Drop" /></a>
                                <a href="/user/boarding">🎫 Boarding Pass <AngleRightIcon className="icon-Drop" /></a>
                                <a href="/user/boarding-gate">🚪 Porte Embarquement <AngleRightIcon className="icon-Drop" /></a>
                                <a href="/user/ewallet">💰 Wallet <AngleRightIcon className="icon-Drop" /></a>
                                {user.role === 'Agent' && (
                                    <>
                                        <a href="/agent/dashboard">🧑‍✈️ Dashboard Agent <AngleRightIcon className="icon-Drop" /></a>
                                        <a href="/agent/bagages/scan">📦 Scan bagage <AngleRightIcon className="icon-Drop" /></a>
                                    </>
                                )}
                                <label className="upload-label">
                                    Changer l’image de profil
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </label>
                                <button onClick={handleLogout} className="btn-logout">
                                    Logout <AngleRightIcon className="icon-Drop" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="auth-links">
                        <a href="/login" className="btn-nav">Sign In</a>
                        <a href="/signup" className="btn-nav">Register</a>
                    </div>
                )}

                {/* Mobile Menu Icon */}
                <div
                    className={`menu-icon ${mobileMenuOpen ? 'open' : ''}`}
                    onClick={toggleMobileMenu}
                >
                    <div className="bar1"></div>
                    <div className="bar2"></div>
                    <div className="bar3"></div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
                onClick={toggleMobileMenu}
            ></div>

            {/* Mobile Sidebar Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <a href="/" className="mobile-menu-logo">
                    <img src={logo} alt="FlexiTrip" className="navbar-logo-img" />
                </a>
                <div className="profile-section">
                    {user ? (
                        <div className="user-info-menu">
                            <img
                                src={profileImage}
                                alt="User Profile"
                                className="profile-pic"
                            />
                            <span className="user-name">{user.name} {user.surname}</span>
                            <span className="user-role">{user.role}</span>
                            <div className="profile-actions">
                                <a href="/user/profile" className="profile-link">
                                    <UserIcon className='icon-user' />{/* Icône SVG */} Profile   
                                </a>
                                <a href="/user/settings" className="profile-link">
                                    <SettingsIcon className="icon-settings" /> {/* Icône SVG */} Settings
                                </a>
                                <button onClick={handleLogout} className="btn-logout-icon"><LogoutIcon className="icon-logout" /> </button>
                            </div>
                        </div>
                    ) : (
                        <div className="auth-links-menu">
                            <a href="/login" className="btn btn-primary">Sign In</a>
                            <a href="/signup" className="btn btn-secondary">Register</a>
                        </div>
                    )}
                </div>
                <ul className="mobile-menu-list">
                    {!user && (
                        <>
                            <li className="nav-item">
                                <a href="/ewallet" className="nav-links" onClick={toggleMobileMenu}>e-Wallet<AngleRightIcon className="icon-angle"/></a>
                            </li>
                        </>
                    )}
                    {user && (
                        <>
                            <li className="nav-item">
                                <a href="/user/home" className="nav-links" onClick={toggleMobileMenu}>Accueil<AngleRightIcon className="icon-angle"/></a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/voyages" className="nav-links" onClick={toggleMobileMenu}>Mes Voyages<AngleRightIcon className="icon-angle"/></a>
                            </li>
                            {(user.role === 'PMR' || user.role === 'Accompagnant') && (
                                <li className="nav-item">
                                    <a href="/user/bagages" className="nav-links" onClick={toggleMobileMenu}>Mes bagages<AngleRightIcon className="icon-angle"/></a>
                                </li>
                            )}
                            <li className="nav-item">
                                <a href="/user/checkin" className="nav-links" onClick={toggleMobileMenu}>Check-in<AngleRightIcon className="icon-angle"/></a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/boarding" className="nav-links" onClick={toggleMobileMenu}>Boarding Pass<AngleRightIcon className="icon-angle"/></a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/boarding-gate" className="nav-links" onClick={toggleMobileMenu}>Porte Embarquement<AngleRightIcon className="icon-angle"/></a>
                            </li>
                            <li className="nav-item">
                                <a href="/user/ewallet" className="nav-links" onClick={toggleMobileMenu}>Wallet<AngleRightIcon className="icon-angle"/></a>
                            </li>
                            {user.role === 'Agent' && (
                                <>
                                    <li className="nav-item">
                                        <a href="/agent/dashboard" className="nav-links" onClick={toggleMobileMenu}>Dashboard Agent<AngleRightIcon className="icon-angle"/></a>
                                    </li>
                                    <li className="nav-item">
                                        <a href="/agent/bagages/scan" className="nav-links" onClick={toggleMobileMenu}>Scan bagage<AngleRightIcon className="icon-angle"/></a>
                                    </li>
                                </>
                            )}
                        </>
                    )}
                </ul>
                <div className="navbar-bottom">
                    <p>© {new Date().getFullYear()} Created by Group Flexitrip and Rayane</p>
                </div>
            </div>
            <div id="google_translate_element"></div>
        </nav>
    );
}

export default Navbar;







