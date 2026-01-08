# 🔄 MIGRATION VERS GOOGLE MAPS APIs

## ✅ Migration terminée - 6 janvier 2026

FlexiTrip PMR utilise maintenant **Google Maps APIs** au lieu de Navitia et Rome2Rio pour la recherche d'itinéraires multimodaux et le monitoring temps réel.

---

## 🎯 Pourquoi Google Maps ?

### Problèmes avec les anciennes APIs
- ❌ **Navitia.io** : devenu payant
- ❌ **Rome2Rio** : devenu payant  
- ❌ Couverture limitée
- ❌ Pas de données traffic temps réel

### Avantages Google Maps
- ✅ **200$ gratuit/mois** (crédit Google Cloud)
- ✅ **Couverture mondiale**
- ✅ **Données temps réel** (traffic, retards)
- ✅ **API complète** (Directions, Places, Geocoding)
- ✅ **Fiabilité entreprise**
- ✅ **Multimodal natif** (train, bus, métro, tram)

---

## 📚 APIs Google Maps utilisées

### 1. **Directions API** 
🔹 Calcul d'itinéraires multimodaux (transit : train/bus/métro)  
🔹 Données temps réel avec `traffic_model`  
🔹 Alternatives multiples  
🔹 Informations accessibilité (wheelchair_accessible)

**Tarif** : 5$ pour 1000 requêtes (200$ gratuit/mois = 40,000 requêtes)

```javascript
// Exemple d'utilisation
const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/directions/json`, {
    params: {
        origin: 'Paris Gare de Lyon',
        destination: 'Lyon Part-Dieu',
        mode: 'transit',
        transit_mode: 'train|bus',
        departure_time: Math.floor(Date.now() / 1000),
        language: 'fr',
        alternatives: true,
        key: GOOGLE_MAPS_API_KEY
    }
});
```

### 2. **Places API**
🔹 Recherche d'aéroports proches  
🔹 Recherche de gares  
🔹 Informations établissements

**Tarif** : 17$ pour 1000 requêtes

```javascript
// Recherche aéroport le plus proche
const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/place/nearbysearch/json`, {
    params: {
        location: `${lat},${lng}`,
        radius: 100000, // 100km
        type: 'airport',
        language: 'fr',
        key: GOOGLE_MAPS_API_KEY
    }
});
```

### 3. **Geocoding API**
🔹 Conversion adresses en coordonnées GPS  
🔹 Conversion coordonnées en adresses

**Tarif** : 5$ pour 1000 requêtes

```javascript
// Géocodage d'une adresse
const response = await axios.get(`${GOOGLE_MAPS_BASE_URL}/geocode/json`, {
    params: {
        address: '123 Rue de la Gare, Paris',
        language: 'fr',
        key: GOOGLE_MAPS_API_KEY
    }
});
```

---

## 🔧 Configuration requise

### 1. Créer un compte Google Cloud

1. Aller sur https://console.cloud.google.com/
2. Créer un nouveau projet : "FlexiTrip PMR"
3. Activer la facturation (carte bancaire requise)
   - Ne vous inquiétez pas : 200$ gratuit/mois inclus
   - Pas de débit automatique après crédit épuisé

### 2. Activer les APIs

Dans Google Cloud Console > APIs & Services > Library :

1. ✅ **Directions API** (OBLIGATOIRE)
2. ✅ **Places API** (OBLIGATOIRE)
3. ✅ **Geocoding API** (OBLIGATOIRE)
4. ✅ **Distance Matrix API** (optionnel)

### 3. Créer une clé API

1. Aller dans **APIs & Services** > **Credentials**
2. Cliquer **+ CREATE CREDENTIALS** > **API key**
3. Copier la clé générée
4. **(Recommandé)** Restreindre la clé :
   - Cliquer sur la clé
   - **Application restrictions** : HTTP referrers ou IP addresses
   - **API restrictions** : Sélectionner uniquement les 3 APIs ci-dessus

### 4. Configurer l'application

Dans votre fichier `.env` :

```env
# Google Maps API (REQUIS)
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Aviationstack API (optionnel - 100 req/mois gratuit)
AVIATIONSTACK_API_KEY=
```

---

## 📊 Estimation des coûts

### Utilisation typique FlexiTrip PMR

| Action | API utilisée | Nb req | Coût/mois |
|--------|--------------|--------|-----------|
| Recherche itinéraire | Directions API | 2,000 | 10$ |
| Géocodage adresses | Geocoding API | 1,000 | 5$ |
| Recherche aéroports | Places API | 200 | 3.40$ |
| Monitoring traffic | Directions API | 5,000 | 25$ |
| **TOTAL** | | **8,200** | **43.40$** |

✅ **Couvert par les 200$ gratuits** largement !

### Pour 100 utilisateurs/jour
- ~200 recherches/jour = 6,000 req/mois
- **Coût : ~30$/mois** (gratuit avec crédit)

---

## 🔄 Changements dans le code

### Fichiers modifiés

#### 1. `services/searchService.js`
**AVANT** (Navitia + Rome2Rio)
```javascript
const NAVITIA_API_KEY = process.env.NAVITIA_API_KEY;
const NAVITIA_BASE_URL = 'https://api.navitia.io/v1';
const ROME2RIO_API_KEY = process.env.ROME2RIO_API_KEY;
```

**APRÈS** (Google Maps)
```javascript
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';
```

#### 2. `services/perturbationService.js`
**AVANT** (Navitia disruptions)
```javascript
const disruptions = await checkNavitiaDisruptions(segment);
```

**APRÈS** (Google Traffic)
```javascript
const trafficInfo = await checkGoogleTraffic(segment);
```

#### 3. `.env.example`
**AVANT**
```env
NAVITIA_API_KEY=your_navitia_api_key
ROME2RIO_API_KEY=your_rome2rio_api_key
```

**APRÈS**
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
AVIATIONSTACK_API_KEY=
```

---

## 🚀 Nouvelles fonctionnalités

### 1. Recherche flexible train/bus/avion

Le système analyse automatiquement la distance :
- **< 300 km** : Uniquement train/bus
- **> 300 km** : Proposition train/bus + option avion

```javascript
// Si distance > 300km
if (distance > 300 && pmrNeeds.accepts_flight !== false) {
    const originAirport = await findNearestAirport(origin);
    const destAirport = await findNearestAirport(destination);
    
    // Créer itinéraire : Domicile → Aéroport → Vol → Destination
    const multimodalWithFlight = await buildMultimodalFlightRoute(...);
}
```

### 2. Détection aéroport le plus proche

```javascript
const airport = await findNearestAirport('Paris');
// Résultat : { name: 'Aéroport Paris-Charles de Gaulle', distance: 25km }
```

### 3. Monitoring traffic temps réel

```javascript
// Check traffic avec traffic_model: 'best_guess'
const trafficInfo = await checkGoogleTraffic(segment);
// Retourne: { delay_minutes: 15, reason: 'Traffic actuel' }
```

---

## 🧪 Tests

### Test 1 : Recherche transit (train/bus)

```bash
curl -X POST http://localhost:17777/api/search/multimodal \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Paris Gare de Lyon",
    "destination": "Lyon Part-Dieu",
    "date": "2026-01-10T09:00:00",
    "pmr_needs": {
      "mobility_aid": "wheelchair",
      "wheelchair_type": "manual"
    }
  }'
```

**Réponse attendue** :
```json
{
  "success": true,
  "count": 5,
  "routes": [
    {
      "id": "google_transit_0_xxx",
      "source": "google_maps",
      "segments": [
        {
          "mode": "train",
          "operator": "SNCF",
          "departure": "Paris Gare de Lyon",
          "arrival": "Lyon Part-Dieu",
          "duration": 120,
          "accessible": true
        }
      ],
      "total_duration": 120,
      "accessibility_score": 0.95,
      "pmr_compatible": true
    }
  ]
}
```

### Test 2 : Recherche longue distance avec avion

```bash
curl -X POST http://localhost:17777/api/search/multimodal \
  -H "Content-Type: application/json" \
  -d '{
    "origin": "Paris",
    "destination": "Marseille",
    "date": "2026-01-10T09:00:00",
    "pmr_needs": {
      "mobility_aid": "wheelchair",
      "accepts_flight": true
    }
  }'
```

**Réponse** : Proposition transit + option avec vol depuis CDG

### Test 3 : Géocodage

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Paris+Gare+de+Lyon&language=fr&key=VOTRE_CLE"
```

---

## ⚠️ Points d'attention

### Limites Google Maps

1. **Accessibility info limitée**
   - `wheelchair_accessible` disponible mais pas toujours à jour
   - Compléter avec données opérateurs (SNCF Accès Plus, etc.)

2. **Vols non inclus dans transit**
   - Directions API ne gère pas les vols
   - FlexiTrip propose vols séparément via Aviationstack ou logique manuelle

3. **Pas de données temps réel train FR parfaites**
   - Google a des données générales
   - Pour retards SNCF précis : envisager API SNCF Open Data en complément

### Migration des données

❌ **Aucune migration de données nécessaire**
- Les utilisateurs existants ne sont pas impactés
- Les nouvelles recherches utilisent automatiquement Google Maps

---

## 📖 Documentation API Google

- **Directions API** : https://developers.google.com/maps/documentation/directions
- **Places API** : https://developers.google.com/maps/documentation/places
- **Geocoding API** : https://developers.google.com/maps/documentation/geocoding
- **Tarifs** : https://mapsplatform.google.com/pricing/

---

## 🆘 Support

### API Key ne fonctionne pas ?

1. Vérifier que les APIs sont bien activées
2. Vérifier que la facturation est configurée
3. Attendre 5-10 min après création de la clé
4. Tester avec curl :

```bash
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Paris&key=VOTRE_CLE"
```

### Dépassement de quota ?

- Consulter **Google Cloud Console** > **APIs & Services** > **Dashboard**
- Voir consommation en temps réel
- Ajuster restrictions de clé si nécessaire

### Questions ?

📧 Contact : support@flexitrip.com

---

## ✅ Checklist déploiement

- [ ] Compte Google Cloud créé
- [ ] Projet créé
- [ ] Facturation configurée (carte bancaire)
- [ ] APIs activées (Directions, Places, Geocoding)
- [ ] Clé API créée et restreinte
- [ ] `GOOGLE_MAPS_API_KEY` dans `.env`
- [ ] Application redémarrée
- [ ] Test recherche Paris → Lyon
- [ ] Test géocodage
- [ ] Monitoring actif

---

🎉 **Migration réussie ! FlexiTrip PMR est maintenant propulsé par Google Maps.**
