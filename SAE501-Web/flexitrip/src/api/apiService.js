/**
 * Service API Universel avec Fallback DEMO
 * 
 * Features:
 * - Gère automatiquement /api ou pas
 * - Fallback auto en DEMO si API down
 * - Support token multi-clés
 * - Compatible avec tout le projet existant
 */

import axios from 'axios';
import { isDemoMode, enableDemoMode } from '../config/demoConfig';
import { getMockData } from '../demo/mockData';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Intercepteur pour ajouter le token (multi-sources)
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les réponses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[API ERROR]', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Récupère le token d'auth (multi-sources pour compatibilité)
   */
  getToken() {
    return (
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('jwt') ||
      sessionStorage.getItem('token') ||
      null
    );
  }

  /**
   * Nettoie l'endpoint (enlève doubles slashes, gère /api)
   */
  cleanEndpoint(endpoint) {
    return endpoint.replace(/\/+/g, '/').replace(/^\//, '');
  }

  /**
   * Requête principale avec fallback intelligent
   */
  async request(method, endpoint, data = null, options = {}) {
    const cleanedEndpoint = this.cleanEndpoint(endpoint);

    // Mode DEMO forcé : retourner mock immédiatement
    if (isDemoMode()) {
      console.log(`[DEMO MODE] ${method.toUpperCase()} /${cleanedEndpoint}`);
      return getMockData('/' + cleanedEndpoint, method, data);
    }

    // Essayer requête normale
    try {
      const response = await this.client({
        method,
        url: '/' + cleanedEndpoint,
        data,
        ...options
      });
      return response.data;
    } catch (error) {
      // Erreur 404 : peut-être qu'il faut /api
      if (error.response?.status === 404 && !cleanedEndpoint.startsWith('api/')) {
        console.warn(`[API] 404 sur /${cleanedEndpoint}, retry avec /api/...`);
        try {
          const response = await this.client({
            method,
            url: '/api/' + cleanedEndpoint,
            data,
            ...options
          });
          return response.data;
        } catch (retryError) {
          // Si ça échoue encore, fallback DEMO
          return this.handleFallback(cleanedEndpoint, method, data, retryError);
        }
      }

      // Autres erreurs critiques : fallback DEMO
      if (
        error.response?.status === 401 ||
        error.response?.status === 500 ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK'
      ) {
        return this.handleFallback(cleanedEndpoint, method, data, error);
      }

      // Erreur non gérée : throw
      throw error;
    }
  }

  /**
   * Gestion du fallback vers DEMO
   */
  handleFallback(endpoint, method, data, error) {
    console.warn(
      `[FALLBACK DEMO] API error ${error.response?.status || error.code} - Using mock data`
    );
    
    // Activer le mode DEMO automatiquement
    enableDemoMode();
    
    // Retourner les données mock
    return getMockData('/' + endpoint, method, data);
  }

  /**
   * Méthodes helpers
   */
  get(endpoint, options = {}) {
    return this.request('get', endpoint, null, options);
  }

  post(endpoint, data = null, options = {}) {
    return this.request('post', endpoint, data, options);
  }

  put(endpoint, data = null, options = {}) {
    return this.request('put', endpoint, data, options);
  }

  patch(endpoint, data = null, options = {}) {
    return this.request('patch', endpoint, data, options);
  }

  delete(endpoint, options = {}) {
    return this.request('delete', endpoint, null, options);
  }
}

// Export instance singleton
const apiService = new ApiService();
export default apiService;
