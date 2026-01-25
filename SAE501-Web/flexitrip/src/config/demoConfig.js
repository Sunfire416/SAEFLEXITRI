/**
 * Configuration du Mode DEMO
 * Permet de basculer entre API réelle et données mock
 */

// Activer DEMO via .env ou localStorage
export const DEMO_MODE = 
  process.env.REACT_APP_DEMO_MODE === 'true' || 
  localStorage.getItem('DEMO_MODE') === 'true';

/**
 * Toggle manuel du mode DEMO
 * Utilisé par le chip dans la navbar
 */
export const toggleDemoMode = () => {
  const current = localStorage.getItem('DEMO_MODE') === 'true';
  localStorage.setItem('DEMO_MODE', (!current).toString());
  window.location.reload();
};

/**
 * Vérifie si le mode DEMO est actif
 * @returns {boolean}
 */
export const isDemoMode = () => {
  return localStorage.getItem('DEMO_MODE') === 'true';
};

/**
 * Active le mode DEMO de force
 * Utilisé par le fallback automatique en cas d'erreur API
 */
export const enableDemoMode = () => {
  localStorage.setItem('DEMO_MODE', 'true');
  console.log('🎭 Mode DEMO activé automatiquement (API indisponible)');
};

/**
 * Désactive le mode DEMO
 */
export const disableDemoMode = () => {
  localStorage.removeItem('DEMO_MODE');
  window.location.reload();
};
