/* src/components/Login/Login.js */

import React, { useState, useContext } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import logo from '../../assets/images/Google.png';
import logo2 from '../../assets/images/Facebook.png';
import { ReactComponent as EyeIcon } from '../../assets/icones/cacher-password.svg';

function LoginPage() {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // Gérer la visibilité du mot de passe
    const navigate = useNavigate();
    
    // fonction pour valider un e-mail
    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev); // Basculer entre visible/masqué
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        // Validation des champs
        if (!email || !password) {
            setErrorMessage('Please fill in all fields.');
            return;
        }
    
        if (!validateEmail(email)) {
            setErrorMessage('Please enter a valid email address.');
            return;
        }
    
        setIsLoading(true);
        setErrorMessage('');
        try {
            const user = await login({ email, password }); // Appeler la fonction login du contexte
            console.log(user); // Vérifiez les informations utilisateur retournées
    
            // Rediriger en fonction du rôle de l'utilisateur
            if (user.role === 'Accompagnant') {
                navigate('/accompagnant/home'); // Redirection spécifique pour les accompagnants
            } else {
                navigate('/user/home'); // Redirection par défaut pour les autres utilisateurs
            }
        } catch (error) {
            if (error.response && error.response.status === 401) {
                setErrorMessage('Invalid email or password.');
            } else {
                setErrorMessage('Something went wrong. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>LOGIN</h2>
                <div className="social-login">
                    <button className="social-button google" disabled={isLoading}>
                        <img src={logo} alt="Google" className="icon-login" />
                        Continue with Google
                    </button>
                    <button className="social-button facebook" disabled={isLoading}>
                        <img src={logo2} alt="Facebook" className="icon-login" />
                        Continue with Facebook
                    </button>
                </div>
                <p>or use your email to log in:</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label>Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                            style={{ paddingRight: '40px' }} // Espace pour l'icône
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            style={{
                                position: 'absolute',
                                right: '0px',
                                top: '49%',
                                transform: 'translateY(-18.2%)',
                                background: '1px',
                                border: '3px solid #ccc',
                                borderRadius: '4px', // Légèrement arrondi pour un style net
                                padding: '2px 10px', // Réduction du padding vertical
                                fontSize: '14px', // Ajustement de la taille du texte si nécessaire
                                cursor: 'pointer',
                                lineHeight: '1', // Empêche l'espacement vertical supplémentaire
                            }}
                        >
                            {showPassword ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    fill="currentColor"
                                    viewBox="0 0 16 16"
                                >
                                    <path d="M16 8s-3.5-6-8-6-8 6-8 6 3.5 6 8 6 8-6 8-6zM8 12a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                                    <path d="M8 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                                </svg>
                            ) : (
                                <EyeIcon width="20" height="20" fill="currentColor" />
                            )}
                        </button>
                    </div>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button type="submit" className="login-button" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>Don't have an account? <a href="/signup">Sign up here</a></p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;











