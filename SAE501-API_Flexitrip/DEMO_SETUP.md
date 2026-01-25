# 🎯 Configuration Démo FlexiTrip

## Stack Technique

### ✅ Technologies Actives
- **Supabase** (PostgreSQL + Auth + Realtime + Storage)
  - Base de données unifiée
  - Authentification intégrée
  - Real-time subscriptions (remplace Kafka)
  - RLS (Row Level Security) activé
- **React Web** (SAE501-Web/flexitrip)
- **React Native Mobile** (SAE501-agentMobileV2)
- **Neo4j** (Optionnel - Recommandations graphes)

### ❌ Technologies Supprimées
- ~~Kafka~~ → **Supabase Realtime**
- ~~Redis~~ → **localStorage** (web) / **AsyncStorage** (mobile)
- ~~MongoDB~~ → **Supabase PostgreSQL**
- ~~MySQL~~ → **Supabase PostgreSQL**
- ~~Sequelize~~ → **Supabase JS SDK**

---

## 🚀 Démarrage Rapide

### 1. Configuration Environnement

**Créer `.env` dans `SAE501-API_Flexitrip/` :**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=17777
NODE_ENV=development

# Neo4j (optionnel)
NEO4J_URL=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# JWT
JWT_SECRET=your-jwt-secret-change-in-production

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:3000
```

**Créer `.env.local` dans `SAE501-Web/flexitrip/` :**
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:17777
```

### 2. Installation

```bash
# API Backend
cd SAE501-API_Flexitrip
npm install
npm run dev

# Web Frontend
cd SAE501-Web/flexitrip
npm install
npm start

# Mobile App
cd SAE501-agentMobileV2/agentpmr
npm install
npm start
```

### 3. Initialisation Base de Données

```bash
# Initialiser le schéma Supabase (première installation)
cd SAE501-API_Flexitrip
npm run init:supabase
```

---

## 👥 Utilisateurs de Test

Les utilisateurs sont déjà créés dans Supabase (table `users`) :

| Role | Email | Mot de passe |
|------|-------|--------------|
| PMR | `pmr@test.com` | Voir Supabase Dashboard |
| Agent | `agent@test.com` | Voir Supabase Dashboard |
| Admin | `admin@test.com` | Voir Supabase Dashboard |

**Accès Dashboard Supabase :**
```
https://app.supabase.com/project/your-project-id
```

**Créer de nouveaux utilisateurs :**
```bash
# Via API (POST /api/auth/signup)
curl -X POST http://localhost:17777/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "SecurePassword123",
    "role": "pmr",
    "nom": "Test",
    "prenom": "User"
  }'
```

---

## 📊 Structure Base de Données

### Tables Principales
- **users** - Utilisateurs (PMR, Agents, Admins)
- **voyages** - Trajets planifiés
- **reservations** - Réservations actives
- **pmr_missions** - Missions agents PMR
- **transactions** - Historique wallet
- **blockchain** - Ledger immuable
- **notifications** - Notifications temps réel

### Vues Dénormalisées
- `blockchain_details` - Blockchain avec infos user
- `reservations_completes` - Réservations + voyage + user
- `voyages_details` - Voyages avec PMR et accompagnant

Voir schéma complet : [RAPPORT_MIGRATION.md](RAPPORT_MIGRATION.md)

---

## 🔄 Remplacement Technologies

### Kafka → Supabase Realtime

**Avant (Kafka) :**
```javascript
const consumer = kafka.consumer({ groupId: 'notifications' });
await consumer.subscribe({ topic: 'pmr-notifications' });
await consumer.run({
  eachMessage: async ({ message }) => {
    console.log(message.value.toString());
  }
});
```

**Après (Supabase) :**
```javascript
const channel = supabase.channel('notifications')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'notifications' 
  }, payload => {
    console.log('Nouvelle notification:', payload.new);
  })
  .subscribe();

// Cleanup
channel.unsubscribe();
```

### Redis → localStorage/AsyncStorage

**Avant (Redis) :**
```javascript
await redis.set('user:123', JSON.stringify(userData), 'EX', 3600);
const cached = await redis.get('user:123');
```

**Après (Web) :**
```javascript
localStorage.setItem('user:123', JSON.stringify(userData));
const cached = JSON.parse(localStorage.getItem('user:123'));

// Expiration manuelle si nécessaire
const item = { data: userData, timestamp: Date.now() };
localStorage.setItem('user:123', JSON.stringify(item));
```

**Après (Mobile) :**
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('user:123', JSON.stringify(userData));
const cached = JSON.parse(await AsyncStorage.getItem('user:123'));
```

### MongoDB/MySQL → Supabase PostgreSQL

**Avant (Sequelize) :**
```javascript
const User = require('./models/User');
const users = await User.findAll({ where: { role: 'pmr' } });
```

**Après (Supabase) :**
```javascript
const supabase = require('./config/supabase');
const { data: users, error } = await supabase
  .from('users')
  .select('*')
  .eq('role', 'pmr');
```

---

## 🧪 Tests

### Tester connexion Supabase
```bash
cd SAE501-API_Flexitrip
node test-supabase.js
```

### Tester API
```bash
# Health check
curl http://localhost:17777/api/health

# Authentification
curl -X POST http://localhost:17777/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"pmr@test.com","password":"your-password"}'

# Liste des voyages
curl http://localhost:17777/api/voyages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Swagger API Documentation
Une fois l'API lancée, accéder à :
```
http://localhost:17777/api-docs
```

---

## 📚 Documentation Complète

- **Architecture Backend** : [ARCHI-BACK.txt](ARCHI-BACK.txt)
- **Guide de Migration** : [MIGRATION_COMPLETE.md](MIGRATION_COMPLETE.md)
- **Rapport Migration** : [RAPPORT_MIGRATION.md](RAPPORT_MIGRATION.md)
- **Variables d'environnement** : Voir `.env.example`
- **API Swagger** : `http://localhost:17777/api-docs`

---

## 🐳 Docker (Optionnel)

Le projet peut être lancé avec Docker Compose :

```bash
cd SAE501-API_Flexitrip

# Construire et lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f api

# Arrêter les services
docker-compose down
```

**Services disponibles :**
- `api` - Backend Node.js (port 17777)
- `neo4j` - Base de données graphe (ports 7474, 7687)
- `web` - Frontend React (port 3000)

**Services supprimés dans la version démo :**
- ~~redis~~ - Remplacé par localStorage
- ~~kafka~~ - Remplacé par Supabase Realtime
- ~~zookeeper~~ - Dépendance Kafka supprimée
- ~~mongodb~~ - Migré vers Supabase
- ~~mysql~~ - Migré vers Supabase

---

## 🆘 Troubleshooting

### ❌ Erreur "Missing Supabase env vars"
**Solution :** Vérifier que `.env` contient `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

### ❌ Erreur CORS
**Solution :** Vérifier dans [app.js](app.js) que le middleware CORS autorise `http://localhost:3000` :
```javascript
app.use(cors({
  origin: ['http://localhost:3000', process.env.FRONTEND_URL],
  credentials: true
}));
```

### ❌ Base de données vide
**Solution :** Exécuter le script d'initialisation :
```bash
npm run init:supabase
```

### ❌ Port 17777 déjà utilisé
**Solution :** Changer le port dans `.env` :
```env
PORT=18888
```
Et mettre à jour `REACT_APP_API_URL` dans le frontend.

### ❌ Neo4j ne démarre pas
**Solution :** Neo4j est optionnel. Pour désactiver, commenter le service dans `docker-compose.yml`

---

## 🔐 Sécurité

### Row Level Security (RLS)
Supabase utilise RLS pour sécuriser les données. Exemples de politiques :

```sql
-- Les PMR ne voient que leurs propres réservations
CREATE POLICY "pmr_own_reservations" ON reservations
  FOR SELECT
  USING (auth.uid() = pmr_id);

-- Les agents voient toutes les missions
CREATE POLICY "agents_all_missions" ON pmr_missions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'accompagnant'
    )
  );
```

### JWT Tokens
Les tokens JWT sont générés par l'API et incluent :
- `userId` - ID utilisateur
- `email` - Email
- `role` - Rôle (pmr, accompagnant, admin)
- Expiration : 24h par défaut

---

## 📱 Mobile (React Native)

### Installation
```bash
cd SAE501-agentMobileV2/agentpmr
npm install

# iOS
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

### Variables d'environnement
Créer `.env` dans `SAE501-agentMobileV2/agentpmr/` :
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
API_URL=http://10.0.2.2:17777  # Émulateur Android
# API_URL=http://localhost:17777  # iOS Simulator
```

---

## 🚦 Statut du Projet

| Composant | Statut | Notes |
|-----------|--------|-------|
| Supabase PostgreSQL | ✅ Actif | Base de données principale |
| Supabase Auth | ✅ Actif | Authentification JWT |
| Supabase Realtime | ⚠️ À implémenter | Remplace Kafka |
| React Web | ✅ Actif | Frontend web |
| React Native | ✅ Actif | Application mobile |
| Neo4j | ⚠️ Optionnel | Recommandations graphes |
| Kafka | ❌ Supprimé | → Supabase Realtime |
| Redis | ❌ Supprimé | → localStorage |
| MongoDB | ❌ Supprimé | → Supabase |
| MySQL | ❌ Supprimé | → Supabase |

---

**Version :** Demo Branch v1.0  
**Stack :** Supabase + React + React Native  
**Date :** Janvier 2026  
**Mainteneur :** Équipe FlexiTrip
