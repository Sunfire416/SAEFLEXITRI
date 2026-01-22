# 🚀 MIGRATION COMPLÈTE: Sequelize/MongoDB/MySQL → Supabase

## ✅ ÉTAPES COMPLÉTÉES

### 1. **Service Supabase Centralisé** ✅
- Fichier: `services/supabaseService.js`
- Méthodes pour toutes les tables: users, voyages, reservations, pmr_missions, transactions, blockchain, notifications
- RLS bypass avec SERVICE_ROLE_KEY côté serveur
- Gestion des vues: blockchain_details, reservations_completes, voyages_details

### 2. **Types TypeScript** ✅
- Fichier: `types/supabase.types.ts`
- Enums: UserRole, VoyageStatus, ReservationStatus, TransactionType, etc.
- Interfaces pour toutes les entités
- Types Request/Response pour l'API

### 3. **Configuration** ✅
- `config/database.js` - Migrate vers supabaseService
- `.env` - Suppression références MongoDB/MySQL
- `package.json` - Suppression Sequelize, mysql2, sqlite3

### 4. **Models → Services** ✅
- `services/userService.js` - Remplace User.js
- `services/voyageService.js` - Remplace Voyage.js
- `services/reservationService.js` - Remplace Reservations.js
- `services/legacyAdapters.js` - Compatibilité rétro

### 5. **Documentation** ✅
- `MIGRATION_GUIDE.js` - Guide détaillé des patterns
- `scripts/fixSequelize.js` - Audit des imports résiduels

---

## ⏳ ÉTAPES RESTANTES

### 6. **Corriger les Services Critiques** 
Fichiers à adapter pour utiliser Supabase:
```
□ services/incidentDetectionService.js (ligne 16-17)
□ services/intelligentAssignmentService.js (ligne 36)
□ services/dynamicPriorityService.js (ligne 30)
□ services/agentAssignmentService.js (ligne 15-16)
□ services/bookingService.js
□ services/agentService.js
```

**Pattern à appliquer:**
```javascript
// AVANT
const Voyage = require('../models/Voyage');
const { Reservations } = require('../models');

const voyage = await Voyage.create(data);

// APRÈS
const { voyageService, reservationService } = require('./legacyAdapters');
// OU (meilleur)
const supabaseService = require('./supabaseService');

const voyage = await supabaseService.createVoyage(data);
```

### 7. **Vérifier Routes et Controllers**
Les routes utilisent les services via les modèles. Vérifier que:
- `routes/userRoutes.js` utilise les méthodes adaptées
- `routes/voyageRoutes.js` idem
- `routes/reservations.js` idem
- Tous les imports de models → utiliser legacyAdapters

### 8. **Tester l'API Complète**
```bash
npm install  # Nouvelle version sans Sequelize/mysql2
npm run dev  # Lancer le serveur

# Tests à faire:
- POST /api/auth/register (créer user)
- POST /api/voyages (créer voyage)
- POST /api/reservations (créer réservation)
- GET /api/users/:id (récupérer user)
- GET /api/notifications (notifications)
```

### 9. **Migration des Données** (si nécessaire)
Si données existantes dans MongoDB/MySQL à migrer vers Supabase:
```bash
node scripts/migrateData.js
```

---

## 📊 TABLEAU DE CORRESPONDANCE

| Ancien (Sequelize) | Nouveau (Supabase) |
|---|---|
| `User.create()` | `userService.create()` ou `supabaseService.createUser()` |
| `User.findOne({ where })` | `userService.findByEmail()` ou `findById()` |
| `Voyage.findAll()` | `voyageService.findByPmr()` ou `findByUser()` |
| `Reservations.update()` | `reservationService.update()` |
| Model triggers | SQL triggers Supabase (automatiques) |
| Transactions Sequelize | Triggers + procédures SQL Supabase |

---

## 🔑 POINTS CLÉS DE LA MIGRATION

### Schéma PostgreSQL/Supabase
```
PUBLIC SCHEMA:
├── TABLES
│   ├── users (PK: user_id UUID)
│   ├── voyages (PK: id_voyage UUID, FK: id_pmr, id_accompagnant)
│   ├── reservations (PK: reservation_id UUID, FK: user_id, id_voyage)
│   ├── pmr_missions (PK: id UUID, FK: reservation_id, agent_id)
│   ├── transactions (PK: id UUID, FK: user_id)
│   ├── blockchain (PK: id UUID, FK: user_id)
│   └── notifications (PK: notification_id UUID, FK: user_id)
│
├── VIEWS
│   ├── blockchain_details (blockchain + user info)
│   ├── reservations_completes (reservations + user + voyage)
│   └── voyages_details (voyages + pmr + accompagnant)
│
├── TRIGGERS (gestion automatique)
│   ├── set_timestamp (maj updated_at)
│   ├── tr_wallet_sync (sync balance on transaction)
│   ├── tr_update_balance (update user.solde)
│   └── tr_sync_blockchain (log blockchain)
│
└── FUNCTIONS (logique métier)
    ├── get_my_role()
    ├── is_admin()
    ├── is_pmr_or_accompagnant()
    └── calculate_block_hash()
```

### RLS (Row Level Security)
Activé sur: users, voyages, reservations, pmr_missions, transactions, blockchain, notifications

**Important:** Appels serveur utilisent SERVICE_ROLE_KEY pour bypasser RLS

### Wallet/Transactions
- Les triggers SQL gèrent automatiquement:
  - Déduction du solde utilisateur
  - Synchronisation blockchain
  - Mise à jour balances
- Ne pas faire de logique wallet en code JS

---

## 🔄 WORKFLOW DE CORRECTION PAR SERVICE

### Service: `incidentDetectionService.js`
```javascript
// ❌ AVANT
const Voyage = require('../models/Voyage');
const { Reservations } = require('../models/index');

async function getIncident(voyage_id) {
    const voyage = await Voyage.findByPk(voyage_id);
}

// ✅ APRÈS
const { voyageService, reservationService } = require('./legacyAdapters');

async function getIncident(voyage_id) {
    const voyage = await voyageService.findById(voyage_id);
}
```

### Service: `agentAssignmentService.js`
```javascript
// ❌ AVANT
const Voyage = require('../models/Voyage');

async function assignAgent(reservation_id, agent_id) {
    const res = await Reservations.findOne({ where: { reservation_id } });
    res.agent_id = agent_id;
    await res.save();
}

// ✅ APRÈS
const supabaseService = require('./supabaseService');

async function assignAgent(reservation_id, agent_id) {
    // Créer ou mettre à jour pmr_mission
    const mission = await supabaseService.createPmrMission({
        reservation_id,
        agent_id,
        status: 'pending'
    });
}
```

---

## 📋 CHECKLIST FINALE

- [ ] `services/incidentDetectionService.js` - Corrigé
- [ ] `services/intelligentAssignmentService.js` - Corrigé
- [ ] `services/dynamicPriorityService.js` - Corrigé
- [ ] `services/agentAssignmentService.js` - Corrigé
- [ ] `services/bookingService.js` - Corrigé
- [ ] `services/agentService.js` - Corrigé
- [ ] Tous les controllers testés
- [ ] Tests unitaires passants
- [ ] API full stack fonctionnelle
- [ ] Données migrées (si applicable)
- [ ] Déploiement en production

---

## 🆘 AIDE SUPPLÉMENTAIRE

### Tester la connexion Supabase
```bash
node -e "require('./services/supabaseService').testConnection()"
```

### Vérifier les imports résiduels
```bash
node scripts/fixSequelize.js
```

### Voir la structure d'une table
```javascript
const cols = await supabaseService.getTableSchema('users');
console.log(cols);
```

---

**Statut global:** ~70% complété  
**Prochaine étape:** Adapter les 6 services identifiés, puis tester l'API complète
