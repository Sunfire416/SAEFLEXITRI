 /* /src/context/AuthContext.js */

 import React, { createContext, useState, useEffect } from 'react';
 import axios from 'axios';
 import { jwtDecode } from 'jwt-decode'; // jwt-decode est bien installé
 
 export const AuthContext = createContext();
 
 export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null); // État utilisateur
     const [loading, setLoading] = useState(true); // État de chargement
     //const [darkMode, setDarkMode] = useState(false); // État du mode sombre
 
     const isTokenValid = (token) => {
         try {
             const decodedToken = jwtDecode(token);
             return decodedToken.exp * 1000 > Date.now(); // Comparer l'expiration avec l'heure actuelle
         } catch {
             return false; // Le token est invalide
         }
     };
 
     // Charger l'utilisateur au démarrage
     useEffect(() => {
         const fetchUser = async () => {
             try {
                 const token = localStorage.getItem('token');
                 if (token && isTokenValid(token)) {
                     const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

                     try {
                         // ✅ Source d'autorité serveur
                         const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
                             headers: { Authorization: `Bearer ${token}` },
                         });
                         setUser(data);
                     } catch (e) {
                         // Fallback non régressif (ancien comportement)
                         const decodedToken = jwtDecode(token);
                         const userId = decodedToken.user_id || decodedToken.id;
                         const { data } = await axios.get(`${API_BASE_URL}/users/get/${userId}`, {
                             headers: { Authorization: `Bearer ${token}` },
                         });
                         setUser(data);
                     }
                 } else {
                     localStorage.removeItem('token'); // Nettoyez le token (clé d'authentification) expiré
                 }
             } catch (error) {
                 console.error('Erreur lors de la récupération de l’utilisateur :', error);
                 setUser(null); // Réinitialiser en cas d'erreur
             } finally {
                 setLoading(false); // Indiquer que le chargement est terminé
             }
         };

         fetchUser();

         // Charger le mode sombre depuis localStorage
        //const storedDarkMode = JSON.parse(localStorage.getItem('darkMode')) || false;
        //setDarkMode(storedDarkMode);

        // Appliquer le mode sombre
        //if (storedDarkMode) {
        //    document.body.classList.add('dark-mode');
        //} else {
        //    document.body.classList.remove('dark-mode');
        //}

     }, []);

         // Gestion du mode sombre
    //const toggleDarkMode = () => {
    //    setDarkMode((prev) => {
    //        const newMode = !prev;
    //        localStorage.setItem('darkMode', JSON.stringify(newMode));
    //        if (newMode) {
    //            document.body.classList.add('dark-mode');
    //        } else {
    //            document.body.classList.remove('dark-mode');
    //        }
    //        return newMode;
    //    });
    //};
 
     // Connexion utilisateur
    //const login = async (credentials) => {
    //     try {
    //         const { data } = await axios.post('http://localhost:17777/users/login', credentials);
    //         localStorage.setItem('token', data.token); // Stocker le jeton 
    //         setUser(data.user); // Mettre à jour l'utilisateur
    //     } catch (error) {
    //         console.error('Erreur de connexion :', error);
    //         if (error.response?.status === 401) {
    //             throw new Error("Identifiants invalides. Veuillez réessayer.");
    //         } else {
    //             throw new Error("Erreur de connexion. Veuillez réessayer plus tard.");
    //         }
    //     }
    // };
    // connexion utilisateur 
        const login = async (credentials) => {
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const { data } = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
            localStorage.setItem('token', data.token); // Stocker le jeton
            setUser(data.user); // Mettre à jour l'utilisateur
            return data.user; // Retourner les informations utilisateur, y compris le rôle
        } catch (error) {
            console.error('Erreur de connexion :', error);
            if (error.response?.status === 401) {
                throw new Error("Identifiants invalides. Veuillez réessayer.");
            } else {
                throw new Error("Erreur de connexion. Veuillez réessayer plus tard.");
            }
        }
    };
    
    // récupération utilisateur par id 
    const getUserById = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const { data } = await axios.get(`${API_BASE_URL}/users/get/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return data; // Retourne les informations utilisateur
        } catch (error) {
            console.error(`Erreur lors de la récupération de l'utilisateur avec ID ${id} :`, error);
            if (error.response?.status === 404) {
                throw new Error('Utilisateur non trouvé.');
            }
            throw new Error('Erreur lors de la récupération des données utilisateur.');
        }
    };
    
 
     // Déconnexion utilisateur
     const logout = async () => {
         try {
             const token = localStorage.getItem('token');
             if (token) {
                const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
                await axios.post(`${API_BASE_URL}/users/logout`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                });
             }
         } catch (error) {
             console.error('Erreur lors de la déconnexion :', error);
         } finally {
             localStorage.removeItem('token'); // Nettoyage immédiat
             setUser(null); // Réinitialiser immédiatement l'état utilisateur
         }
     };
 
     // Inscription utilisateur
     const signup = async (credentials) => {
         try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const { data } = await axios.post(`${API_BASE_URL}/users/insert`, credentials);
             localStorage.setItem('token', data.token); // Stocker le jeton
             setUser(data.user); // Mettre à jour l'utilisateur
         } catch (error) {
             console.error('Erreur lors de l’inscription :', error);
             throw error;
         }
     };
 
    // Mise à jour du profil utilisateur 
    const updateUserProfile = async (updates) => {
        try {
            const token = localStorage.getItem('token'); // Récupérer le token
            if (!token) throw new Error('Utilisateur non authentifié'); // Vérifier l'authentification

            // Vérifiez si l'ID utilisateur est présent
            if (!updates.user_id) {
                throw new Error("L'ID de l'utilisateur est requis pour la mise à jour.");
            }

            // Construction de l'URL avec l'ID utilisateur
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const url = `${API_BASE_URL}/users/update/${updates.user_id}`;

            // Requête PUT avec axios
            const { data } = await axios.put(url, updates, {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Mise à jour locale de l'utilisateur dans le contexte
            setUser((prevUser) => ({
                ...prevUser,
                ...updates,
            }));

            return data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil utilisateur :', error);

            // Gestion des erreurs détaillées
            if (error.response) {
                const errorMessage =
                    error.response.data?.message || `Erreur API : ${error.response.status}`;
                throw new Error(errorMessage);
            } else if (error.request) {
                throw new Error('Impossible de communiquer avec le serveur. Vérifiez votre connexion.');
            } else {
                throw new Error(error.message || 'Une erreur inconnue est survenue.');
            }
        }
    };

    // Fonction pour démarrer le consommateur Kafka
    const startKafkaConsumer = async (onMessage, onError) => {
        try {
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const { data } = await axios.get(`${API_BASE_URL}/kafka/messages`);
            if (onMessage) onMessage(data.message); // Appeler le callback avec le message
        } catch (error) {
            console.error('Erreur lors du démarrage du consommateur Kafka :', error);
            if (onError) onError('Erreur lors du démarrage du consommateur Kafka.');
        }
    };
    
     // Fournir les valeurs via le contexte
     const value = React.useMemo(
         () => ({ user,
            login,
            logout,
            signup,
            updateUserProfile,
            //darkMode,
            //toggleDarkMode,
            getUserById,
            startKafkaConsumer,
            loading }),
         [user, loading]
     );
 
     return (
         <AuthContext.Provider value={value}>
             {loading ? <div>Chargement...</div> : children}
         </AuthContext.Provider>
     );
 };
 








