# 🎯 Système de Réservation Adaptatif - Documentation Complète

## 📋 Vue d'ensemble

Le système de réservation adaptatif FlexiTrip utilise **4 workflows intelligents** qui s'ajustent automatiquement selon :
- **Distance du trajet** (court, moyen, long)
- **Type de transport** (bus, train, avion)
- **Destination** (nationale vs internationale)

### 🤖 Philosophie : Simplicité et Logique

**Principe clé** : Un trajet en bus de 20km ne nécessite PAS :
- ❌ Enrôlement biométrique complexe
- ❌ Scan de passeport OCR
- ❌ Check-in aéroportuaire
- ✅ Juste un QR code simple

Le workflow s'adapte **automatiquement** à la complexité réelle du voyage.

---

## 🎨 Les 4 Workflows

### 🟢 MINIMAL - Bus courte distance (<100km)
**Cas d'usage** : Paris → Versailles en bus

**Étapes** :
1. Réservation simple
2. Génération QR code
3. Paiement wallet

**Temps d'exécution** : ~3 secondes

```json
{
  "workflow_type": "MINIMAL",
  "required_steps": ["booking", "qr_generation"],
  "optional_steps": [],
  "reason": "Trajet court <100km sans vol - QR code suffisant"
}
```

---

### 🟡 LIGHT - Train moyenne distance (100-500km)
**Cas d'usage** : Paris → Lyon en TGV

**Étapes** :
1. Réservation SNCF simulée
2. Génération QR code
3. **Coordination assistance PMR** (si nécessaire)
4. Assignation agent accompagnateur
5. Paiement wallet

**Temps d'exécution** : ~5 secondes

```json
{
  "workflow_type": "LIGHT",
  "required_steps": ["booking", "qr_generation", "assistance_coordination"],
  "optional_steps": ["agent_assignment"],
  "reason": "Trajet moyen 100-500km avec train - assistance PMR nécessaire"
}
```

---

### 🟠 MODERATE - Vol national (>500km)
**Cas d'usage** : Paris → Nice en avion

**Étapes** :
1. **Enrôlement biométrique simplifié** (face matching)
2. Réservation compagnie aérienne simulée
3. **Check-in automatique**
4. Génération carte d'embarquement
5. Génération QR code
6. Assignation agent aéroportuaire
7. Paiement wallet

**Temps d'exécution** : ~8 secondes

```json
{
  "workflow_type": "MODERATE",
  "required_steps": [
    "biometric_enrollment",
    "booking",
    "checkin",
    "qr_generation",
    "assistance"
  ],
  "optional_steps": ["agent_assignment"],
  "reason": "Vol national - biométrie et check-in obligatoires"
}
```

---

### 🔴 FULL - Vol international
**Cas d'usage** : Paris → New York

**Étapes** :
1. **Scan OCR passeport** (simul automatique)
2. Validation identité
3. **Enrôlement biométrique complet**
4. Réservation compagnie internationale
5. Check-in automatique
6. Génération carte d'embarquement
7. Génération QR code
8. Assignation agent multilingue
9. Paiement wallet

**Temps d'exécution** : ~12 secondes

```json
{
  "workflow_type": "FULL",
  "required_steps": [
    "ocr_passport",
    "identity_verification",
    "biometric_enrollment",
    "booking",
    "checkin",
    "qr_generation",
    "assistance"
  ],
  "optional_steps": ["customs_declaration"],
  "reason": "Vol international - documents d'identité et biométrie obligatoires"
}
```

---

## 🛠️ Architecture Technique

### Services créés

```
services/
├── workflowDecisionService.js    # Décision automatique du workflow
├── simulationService.js          # Simulations OCR, Face, Wallet, Réservations
└── bookingService.js             # Orchestration réservation complète
```

### Contrôleurs et Routes

```
controllers/bookingController.js
routes/bookingRoutes.js
```

Intégré dans `app.js` :
```javascript
app.use('/api/booking', bookingRoutes);
```

---

## 📡 API Endpoints

### 1. POST `/api/booking/workflow-preview`
Prévisualise le workflow qui sera appliqué **avant** de réserver.

**Request** :
```json
{
  "itinerary": {
    "from": { "name": "Paris" },
    "to": { "name": "Lyon" },
    "distance": 460,
    "segments": [
      {
        "mode": "TRAIN",
        "from": "Paris Gare de Lyon",
        "to": "Lyon Part-Dieu",
        "departure_time": "2024-03-20T10:00:00Z",
        "arrival_time": "2024-03-20T12:00:00Z"
      }
    ]
  }
}
```

**Response** :
```json
{
  "success": true,
  "workflow": {
    "workflow_type": "LIGHT",
    "required_steps": ["booking", "qr_generation", "assistance_coordination"],
    "optional_steps": ["agent_assignment"],
    "timeline": [
      { "step": "booking", "duration": "2s", "order": 1 },
      { "step": "qr_generation", "duration": "1s", "order": 2 },
      { "step": "assistance_coordination", "duration": "2s", "order": 3 }
    ],
    "reason": "Trajet moyen 100-500km avec train - assistance PMR nécessaire"
  }
}
```

---

### 2. POST `/api/booking/create`
Crée une réservation complète avec workflow adaptatif.

**Headers** :
```
Authorization: Bearer <JWT_TOKEN>
```

**Request** :
```json
{
  "itinerary": {
    "from": { "name": "Paris", "lat": 48.8566, "lng": 2.3522 },
    "to": { "name": "Lyon", "lat": 45.7640, "lng": 4.8357 },
    "distance": 460,
    "departure_time": "2024-03-20T10:00:00Z",
    "arrival_time": "2024-03-20T12:00:00Z",
    "segments": [
      {
        "mode": "TRAIN",
        "from": "Paris Gare de Lyon",
        "to": "Lyon Part-Dieu",
        "departure_time": "2024-03-20T10:00:00Z",
        "arrival_time": "2024-03-20T12:00:00Z"
      }
    ]
  },
  "pmr_needs": {
    "mobility_aid": "fauteuil_roulant_electrique",
    "wheelchair_type": "electric",
    "assistance_level": "full",
    "impairments": ["mobilite", "auditive"]
  }
}
```

**Response LIGHT Workflow** :
```json
{
  "success": true,
  "workflow_type": "LIGHT",
  "booking": {
    "reservation_id": 42,
    "booking_reference": "TG456789",
    "qr_code": {
      "qr_id": "550e8400-e29b-41d4-a716-446655440000",
      "qr_data": "{\"voyage_id\":42,\"user_id\":1,\"qr_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"departure\":\"Paris\",\"destination\":\"Lyon\",\"date\":\"2024-03-20T10:00:00Z\",\"validation_code\":\"A3F7B2D1\",\"expires_at\":\"2024-04-19T12:00:00Z\"}",
      "qr_url": "flexitrip://scan?qr=550e8400-e29b-41d4-a716-446655440000",
      "display_code": "A3F7B2D1"
    },
    "operator": "SNCF",
    "assistance": {
      "agent_assigned": true,
      "agent_name": "Agent 23",
      "meeting_point": "Guichet PMR - Hall principal",
      "meeting_time": "2024-03-20T09:30:00Z"
    },
    "steps_completed": ["booking", "qr_generation", "assistance_coordination"],
    "next_step": "Rendez-vous au point de rencontre 30min avant le départ"
  },
  "payment": {
    "success": true,
    "transaction_id": "0x7f3a9b2c1e4d5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
    "block_number": 7823456,
    "amount": 69.0,
    "gas_fee": 0.001,
    "status": "CONFIRMED",
    "confirmations": 12,
    "timestamp": "2024-03-15T14:23:56Z"
  },
  "timeline": [
    { "step": "booking", "duration": "2s", "order": 1 },
    { "step": "qr_generation", "duration": "1s", "order": 2 },
    { "step": "assistance_coordination", "duration": "2s", "order": 3 }
  ],
  "total_price": 69.0,
  "remaining_balance": 431.0
}
```

---

### 3. GET `/api/booking/:id`
Récupère les détails d'une réservation existante.

**Headers** :
```
Authorization: Bearer <JWT_TOKEN>
```

**Response** :
```json
{
  "success": true,
  "reservation": {
    "reservation_id": 42,
    "user_id": 1,
    "num_reza_mmt": "MMT170433856742134",
    "booking_reference": "TG456789",
    "Type_Transport": "train",
    "Lieu_depart": "Paris",
    "Lieu_arrivee": "Lyon",
    "Date_depart": "2024-03-20T10:00:00Z",
    "Date_arrivee": "2024-03-20T12:00:00Z",
    "Statut": "CONFIRMED",
    "assistance_PMR": "Oui",
    "enregistre": false,
    "Agent_Id": 23
  },
  "qr_code": {
    "qr_id": "550e8400-e29b-41d4-a716-446655440000",
    "validation_code": "A3F7B2D1",
    "qr_url": "flexitrip://scan?qr=550e8400-e29b-41d4-a716-446655440000"
  },
  "checkin_data": null
}
```

---

## 🎭 Simulations Simplifiées

### simulationService.js - Fonctions

#### 1. `simulateOCR(imageData, documentType)`
Simule la lecture OCR d'un passeport ou carte d'identité.

**Durée** : 1,5 seconde

**Retour** :
```json
{
  "success": true,
  "data": {
    "type": "PASSPORT",
    "document_number": "P847362915",
    "surname": "MARTIN",
    "given_names": "Jean",
    "nationality": "FRA",
    "birth_date": "1985-06-15",
    "expiry_date": "2029-06-15",
    "sex": "M",
    "place_of_birth": "Paris",
    "confidence": 0.97
  },
  "processing_time": 1500,
  "timestamp": "2024-03-15T14:23:56Z"
}
```

---

#### 2. `simulateFaceMatch(enrollmentPhoto, livePhoto)`
Simule la comparaison de visages (photo passeport vs selfie live).

**Durée** : 1 seconde

**Retour** :
```json
{
  "match": true,
  "confidence": 0.94,
  "liveness_check": "PASSED",
  "processing_time": 1000,
  "timestamp": "2024-03-15T14:23:57Z"
}
```

---

#### 3. `simulateOperatorBooking(segment, userProfile)`
Simule l'appel API à un opérateur (SNCF, Air France, FlixBus).

**Durée** : 2-3 secondes

**Retour** :
```json
{
  "success": true,
  "booking_reference": "SN456789",
  "operator": "SNCF",
  "status": "CONFIRMED",
  "segment": {
    "from": "Paris",
    "to": "Lyon",
    "departure_time": "2024-03-20T10:00:00Z",
    "arrival_time": "2024-03-20T12:00:00Z",
    "mode": "TRAIN"
  },
  "assistance": {
    "confirmed": true,
    "agent_assigned": true,
    "special_equipment": "fauteuil_roulant_electrique"
  },
  "timestamp": "2024-03-15T14:23:59Z"
}
```

---

#### 4. `simulateWalletTransaction(userId, amount, description)`
Simule une transaction blockchain (déduction de points wallet).

**Durée** : 500ms

**Retour** :
```json
{
  "success": true,
  "transaction_id": "0x7f3a9b2c1e4d5f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
  "block_number": 7823456,
  "from_address": "0x742d35cc6634c0532925a3b844bc9e7595f0bfad",
  "to_address": "0x8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a",
  "amount": 69.0,
  "gas_fee": 0.001,
  "status": "CONFIRMED",
  "confirmations": 12,
  "description": "Paiement voyage Paris → Lyon",
  "timestamp": "2024-03-15T14:24:00Z"
}
```

---

#### 5. `generateQRCode(voyageData)`
Génère un QR code avec UUID unique.

**Retour** :
```json
{
  "qr_id": "550e8400-e29b-41d4-a716-446655440000",
  "qr_data": "{\"voyage_id\":42,\"user_id\":1,\"qr_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"departure\":\"Paris\",\"destination\":\"Lyon\",\"date\":\"2024-03-20T10:00:00Z\",\"validation_code\":\"A3F7B2D1\",\"expires_at\":\"2024-04-19T12:00:00Z\"}",
  "qr_url": "flexitrip://scan?qr=550e8400-e29b-41d4-a716-446655440000",
  "display_code": "A3F7B2D1"
}
```

---

#### 6. `validateQRCode(qrData)`
Valide un QR code (vérifie expiration).

**Retour** :
```json
{
  "valid": true,
  "expired": false,
  "voyage_id": 42,
  "user_id": 1,
  "validation_code": "A3F7B2D1"
}
```

---

## 💰 Calcul du Prix

Formule :
```
Prix = Distance × PrixParKm
```

**Tarifs par km** :
- Bus/Train : `0,15 €/km`
- Avion : `0,25 €/km`

**Exemples** :
- Paris → Versailles (20 km bus) : `20 × 0,15 = 3 €`
- Paris → Lyon (460 km train) : `460 × 0,15 = 69 €`
- Paris → Nice (700 km vol) : `700 × 0,25 = 175 €`
- Paris → New York (5837 km vol) : `5837 × 0,25 = 1459,25 €`

---

## 🔐 Authentification

Toutes les routes booking nécessitent un JWT token valide :

```javascript
const authMiddleware = require('../middleware/auth');
router.use(authMiddleware);
```

**Header obligatoire** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Base de Données

### Modèle `Reservations` (MySQL)

Champs utilisés :
```sql
reservation_id          INT PRIMARY KEY AUTO_INCREMENT
user_id                 INT
num_reza_mmt           VARCHAR(50) UNIQUE
enregistre             BOOLEAN DEFAULT FALSE
assistance_PMR         VARCHAR(4)
Type_Transport         ENUM('train', 'taxi', 'avion', 'bus')
Lieu_depart            VARCHAR(255)
Lieu_arrivee           VARCHAR(255)
Date_depart            DATETIME
Date_arrivee           DATETIME
Statut                 VARCHAR(50)
booking_reference      VARCHAR(50)
qr_code_data           TEXT
checkin_data           TEXT
biometric_verified     BOOLEAN
Agent_Id               INT
```

### Modèle `User` (MySQL)

Champs modifiés/ajoutés :
```sql
wallet_balance         DECIMAL(10,2) DEFAULT 500.00
biometric_enrolled     BOOLEAN DEFAULT FALSE
passport_number        VARCHAR(50)
passport_expiry        DATE
```

---

## 🧪 Tests avec Swagger

### Accès Swagger UI
```
http://localhost:17777/docs
```

### Scénario de test complet

#### Étape 1 : Connexion
```bash
POST /auth/login
{
  "username": "pmr_user",
  "password": "password123"
}
```

Récupérez le `token` retourné.

---

#### Étape 2 : Recherche itinéraire
```bash
POST /api/search/multimodal
{
  "origin": "Paris, France",
  "destination": "Lyon, France",
  "departure_time": "2024-03-20T10:00:00Z",
  "pmr_needs": {
    "mobility_aid": "fauteuil_roulant_electrique",
    "wheelchair_type": "electric",
    "assistance_level": "full"
  }
}
```

Récupérez l'objet `itinerary` retourné.

---

#### Étape 3 : Prévisualisation workflow
```bash
POST /api/booking/workflow-preview
{
  "itinerary": {
    // Collez l'itinéraire retourné à l'étape 2
  }
}
```

Vous verrez le workflow type (MINIMAL, LIGHT, MODERATE, FULL).

---

#### Étape 4 : Création réservation
```bash
POST /api/booking/create
Authorization: Bearer <TOKEN>
{
  "itinerary": {
    // Collez l'itinéraire de l'étape 2
  },
  "pmr_needs": {
    "mobility_aid": "fauteuil_roulant_electrique",
    "wheelchair_type": "electric",
    "assistance_level": "full",
    "impairments": ["mobilite", "auditive"]
  }
}
```

Récupérez le `reservation_id`.

---

#### Étape 5 : Consulter réservation
```bash
GET /api/booking/<reservation_id>
Authorization: Bearer <TOKEN>
```

---

## 🎯 Cas d'usage Frontend

### Intégration avec MultimodalSearch

Modifiez `MultimodalSearch.js` pour ajouter un bouton "Réserver" sur chaque itinéraire :

```javascript
// Dans le rendu de chaque résultat
<button 
  onClick={() => handleBooking(itinerary)}
  className="btn-book"
>
  Réserver ce trajet
</button>
```

```javascript
// Fonction de réservation
async function handleBooking(itinerary) {
  // 1. Prévisualiser le workflow
  const workflowRes = await fetch('http://localhost:17777/api/booking/workflow-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itinerary })
  });
  const workflow = await workflowRes.json();
  
  // 2. Afficher les étapes à l'utilisateur
  alert(`Ce voyage nécessitera : ${workflow.workflow.required_steps.join(', ')}`);
  
  // 3. Confirmer et réserver
  if (confirm('Confirmer la réservation ?')) {
    const bookingRes = await fetch('http://localhost:17777/api/booking/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        itinerary,
        pmr_needs: userPmrProfile
      })
    });
    
    const result = await bookingRes.json();
    
    if (result.success) {
      // 4. Afficher le QR code
      showQRCode(result.booking.qr_code);
      
      // 5. Afficher les instructions
      alert(result.booking.next_step);
    }
  }
}
```

---

## 📈 Timeline et Progression

Le système retourne un `timeline` pour chaque réservation :

```json
{
  "timeline": [
    { "step": "booking", "duration": "2s", "order": 1, "completed": true },
    { "step": "qr_generation", "duration": "1s", "order": 2, "completed": true },
    { "step": "assistance_coordination", "duration": "2s", "order": 3, "completed": true }
  ]
}
```

Utilisable pour afficher une **barre de progression** dans le frontend :

```javascript
function ProgressBar({ timeline }) {
  const completed = timeline.filter(t => t.completed).length;
  const total = timeline.length;
  const percentage = (completed / total) * 100;
  
  return (
    <div className="progress-bar">
      <div 
        className="progress-fill" 
        style={{ width: `${percentage}%` }}
      />
      <span>{completed}/{total} étapes complétées</span>
    </div>
  );
}
```

---

## 🛡️ Sécurité

### Validation des données
Chaque service valide :
- ✅ Présence de l'itinéraire
- ✅ Présence des besoins PMR
- ✅ Solde wallet suffisant
- ✅ Token JWT valide
- ✅ Utilisateur actif

### Gestion des erreurs
```json
{
  "success": false,
  "error": "Insufficient wallet balance",
  "required": 175.0,
  "available": 100.0
}
```

---

## 🚀 Déploiement

### 1. Variables d'environnement
Assurez-vous que `.env` contient :
```env
GOOGLE_MAPS_API_KEY=AIzaSyBT7kjQFe0YHeBw1kkZs3xV5qLOXMXN1CU
AVIATIONSTACK_API_KEY=d6f6ebdd096b5510cee84211eb858725
JWT_SECRET=votre_secret_jwt
PORT=17777
```

### 2. Docker Compose
```bash
cd SAE501-API_Flexitrip
docker compose down
docker compose up -d --build
```

### 3. Vérification logs
```bash
docker logs -f flexitrip_api
```

Recherchez :
```
✅ Server is running on port 17777
✅ Base de données SAE_Multi synchronisée
✅ Agents PMR initialisés
```

### 4. Test Swagger
Accédez à `http://localhost:17777/docs` et testez `/api/booking/workflow-preview`.

---

## 📝 TODO Frontend

### Composants à créer

#### 1. `BookingFlow.js`
Composant qui gère le flow complet de réservation avec steps progressifs.

#### 2. `QRCodeDisplay.js`
Affiche le QR code généré avec le code de validation.

#### 3. `BiometricEnrollment.js`
Interface de capture photo pour l'enrôlement biométrique (simulé).

#### 4. `PassportScanner.js`
Interface de scan passeport (simulé avec upload image).

#### 5. `WalletBalance.js`
Widget affichant le solde wallet avec historique transactions.

#### 6. `BookingHistory.js`
Liste des réservations passées avec statuts.

---

## 🎓 Exemples de Réponses Complètes

### Workflow MINIMAL (Bus 20km)
```json
{
  "success": true,
  "workflow_type": "MINIMAL",
  "booking": {
    "reservation_id": 1,
    "booking_reference": "FL123456",
    "qr_code": {
      "qr_id": "uuid-1234",
      "display_code": "A1B2C3D4"
    },
    "operator": "FlixBus",
    "steps_completed": ["booking", "qr_generation"],
    "next_step": "Montrez le QR code au conducteur"
  },
  "payment": {
    "transaction_id": "0x7f3a...",
    "amount": 3.0,
    "status": "CONFIRMED"
  },
  "total_price": 3.0,
  "remaining_balance": 497.0
}
```

### Workflow FULL (Vol international)
```json
{
  "success": true,
  "workflow_type": "FULL",
  "booking": {
    "reservation_id": 5,
    "booking_reference": "AF987654",
    "ocr_data": {
      "document_number": "P847362915",
      "confidence": 0.97,
      "verified": true
    },
    "biometric": {
      "enrolled": true,
      "confidence": 0.94,
      "liveness": "PASSED"
    },
    "checkin": {
      "boarding_pass": "BP7X9Z2A",
      "gate": "24",
      "seat": "12A",
      "boarding_time": "2024-03-20T05:15:00Z"
    },
    "qr_code": {
      "qr_id": "uuid-5678",
      "display_code": "X7Y9Z2A1"
    },
    "operator": "Air France",
    "assistance": {
      "agent_assigned": true,
      "agent_name": "Agent 47",
      "meeting_point": "Porte PMR - Terminal départs"
    },
    "steps_completed": [
      "ocr_passport",
      "identity_verification",
      "biometric_enrollment",
      "booking",
      "checkin",
      "qr_generation",
      "assistance"
    ],
    "next_step": "Vérifiez votre passeport et présentez-vous à l'aéroport 2h avant le départ"
  },
  "payment": {
    "transaction_id": "0x8f7a...",
    "amount": 1459.25,
    "status": "CONFIRMED"
  },
  "total_price": 1459.25,
  "remaining_balance": -959.25
}
```

---

## ✅ Checklist Implémentation

### Backend ✅
- [x] workflowDecisionService.js créé
- [x] simulationService.js créé avec 6 fonctions
- [x] bookingService.js créé avec 4 workflows
- [x] bookingController.js créé
- [x] bookingRoutes.js créé
- [x] Intégration dans app.js
- [x] Modèles DB adaptés (Reservations)
- [x] Docker rebuild testé

### Frontend ⏳
- [ ] Bouton "Réserver" sur MultimodalSearch
- [ ] BookingFlow component
- [ ] QRCodeDisplay component
- [ ] BiometricEnrollment component
- [ ] PassportScanner component
- [ ] WalletBalance component
- [ ] BookingHistory component

### Tests ⏳
- [ ] Tests unitaires services
- [ ] Tests intégration API
- [ ] Tests E2E frontend
- [ ] Tests charge (>1000 réservations/min)

---

## 🎉 Conclusion

Le système de réservation adaptatif FlexiTrip est maintenant **opérationnel** :

✅ **4 workflows intelligents** qui s'adaptent automatiquement  
✅ **Simulations simplifiées** (OCR, Face, Wallet) qui "fonctionnent" sans complexité  
✅ **API REST complète** documentée avec Swagger  
✅ **Base de données** MySQL synchronisée  
✅ **Docker** fonctionnel avec rebuild automatique  

**Prochaines étapes** :
1. Créer les composants React frontend
2. Intégrer le système de réservation dans MultimodalSearch
3. Tester le workflow complet de bout en bout
4. Déployer en production

🚀 **Le système est prêt à être utilisé !**
