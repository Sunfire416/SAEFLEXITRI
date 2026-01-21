# PMR Tracking Component

## Description
Composant React de suivi de prise en charge PMR (Personnes à Mobilité Réduite). Affiche une carte interactive Leaflet avec le trajet, le statut de l'agent et un QR code du voyageur.

## Fonctionnalités
- 📍 **Carte Leaflet interactive** : Affiche le trajet, le point de rendez-vous et l'agent
- 👤 **Suivi d'agent** : Affiche le statut et la position de l'agent PMR en temps réel
- 🟡 **Indicateurs de statut** : 
  - Jaune : Agent en route
  - Vert : Agent arrivé
  - Bleu : Prise en charge en cours
- 📱 **QR Code** : Génération du QR code du voyageur
- 🆘 **Support** : Bouton d'alerte pour demander de l'aide
- 📱 **Responsive** : Adapté aux appareils mobiles

## Dépendances
- `react` >= 18.3.1
- `react-leaflet` >= 4.2.1
- `leaflet` >= 1.9.4
- `qrcode.react` >= 4.2.0

## Utilisation

### Import
```jsx
import PMRTracking from './components/PmrAssistance/PmrAssistance';

function App() {
  return <PMRTracking />;
}
```

### Route
La page est déjà intégrée à la route `/pmr-assistance` via `PmrAssisPage.js`.

## État du Composant
- `status` : État de l'agent ('en_route', 'arrived', 'in_mission')
- `agentPosition` : Coordonnées [latitude, longitude] de l'agent
- `helpRequested` : Booléen pour afficher le message d'alerte

## Exemple d'utilisation
Accédez à `/pmr-assistance` dans votre navigateur pour voir le composant en action.

## Personnalisation
Vous pouvez modifier :
- Les coordonnées des marqueurs (lignes 24-26)
- Le nom de l'agent (ligne 122)
- Le temps estimé (ligne 127)
- Les messages d'aide (ligne 171)
- Les couleurs via les variables CSS

## Styling
Les styles sont définis dans `PmrAssistance.css` avec des variables CSS réutilisables.

## Responsive Design
- Desktop : Largeur maximale 800px
- Tablette : Adapté à partir de 768px
- Mobile : Adapté pour écrans < 480px
