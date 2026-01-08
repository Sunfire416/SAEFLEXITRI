# 🔗 Routes Frontend à Ajouter dans App.js

## ⚠️ IMPORTANT : Ajout des Routes Manquantes

Pour que toutes les nouvelles fonctionnalités fonctionnent, vous devez ajouter ces routes dans votre fichier `SAE501-Web/flexitrip/src/App.js`

---

## 📝 Routes à Ajouter

### **1. Import des Composants** (en haut du fichier)

```javascript
// Composants existants (vérifier qu'ils sont présents)
import VoyageHistory from './components/Voyages/VoyageHistory';
import VoyageCard from './components/Voyages/VoyageCard';

// 🆕 NOUVEAUX COMPOSANTS À IMPORTER
import CheckInInterface from './components/CheckIn/CheckInInterface';
import WalletHistory from './components/Wallet/WalletHistory';
import FeedbackForm from './components/Feedback/FeedbackForm';
import VoyageTracking from './components/Tracking/VoyageTracking';
import AgentDashboard from './components/Agent/AgentDashboard';
```

---

### **2. Routes à Ajouter** (dans le Router)

Ajoutez ces routes dans la section `<Routes>` de votre App.js :

```javascript
<Routes>
  {/* ... Routes existantes ... */}

  {/* 🆕 Check-in Manuel */}
  <Route 
    path="/user/checkin/:reservationId" 
    element={<CheckInInterface />} 
  />

  {/* 🆕 Historique Wallet */}
  <Route 
    path="/user/wallet/history" 
    element={<WalletHistory />} 
  />

  {/* 🆕 Formulaire Feedback */}
  <Route 
    path="/feedback/:reservationId" 
    element={<FeedbackForm />} 
  />

  {/* 🆕 Suivi Temps Réel */}
  <Route 
    path="/user/tracking/:reservationId" 
    element={<VoyageTracking />} 
  />

  {/* 🆕 Dashboard Agent PMR */}
  <Route 
    path="/agent/dashboard" 
    element={<AgentDashboard />} 
  />
</Routes>
```

---

## 🔍 Exemple Complet App.js

Voici un exemple de structure complète avec toutes les routes :

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Pages publiques
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MultimodalSearch from './components/Search/MultimodalSearch';

// Pages utilisateur
import UserProfile from './pages/UserProfile';
import VoyageHistory from './components/Voyages/VoyageHistory';
import Wallet from './components/Wallet/Wallet';

// 🆕 Nouveaux composants
import CheckInInterface from './components/CheckIn/CheckInInterface';
import WalletHistory from './components/Wallet/WalletHistory';
import FeedbackForm from './components/Feedback/FeedbackForm';
import VoyageTracking from './components/Tracking/VoyageTracking';
import AgentDashboard from './components/Agent/AgentDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Pages publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<MultimodalSearch />} />

          {/* Pages utilisateur */}
          <Route path="/user/profile" element={<UserProfile />} />
          <Route path="/user/voyages" element={<VoyageHistory />} />
          <Route path="/user/wallet" element={<Wallet />} />

          {/* 🆕 Nouvelles routes */}
          <Route path="/user/checkin/:reservationId" element={<CheckInInterface />} />
          <Route path="/user/wallet/history" element={<WalletHistory />} />
          <Route path="/feedback/:reservationId" element={<FeedbackForm />} />
          <Route path="/user/tracking/:reservationId" element={<VoyageTracking />} />
          
          {/* 🆕 Route agent */}
          <Route path="/agent/dashboard" element={<AgentDashboard />} />

          {/* Redirect par défaut */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

---

## 🔗 Liens Depuis les Composants Existants

### **Dans VoyageHistory.js**

Ajoutez des boutons pour accéder aux nouvelles fonctionnalités :

```javascript
// Dans le composant VoyageCard ou VoyageHistory
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// Bouton Check-in
<button onClick={() => navigate(`/user/checkin/${voyage.reservation_id}`)}>
  ✈️ Check-in
</button>

// Bouton Suivi
<button onClick={() => navigate(`/user/tracking/${voyage.reservation_id}`)}>
  🗺️ Suivi temps réel
</button>

// Bouton Feedback
<button onClick={() => navigate(`/feedback/${voyage.reservation_id}`)}>
  ⭐ Laisser un avis
</button>
```

### **Dans Wallet.js**

Ajoutez un lien vers l'historique :

```javascript
<button onClick={() => navigate('/user/wallet/history')}>
  📊 Voir historique complet
</button>
```

### **Dans Navigation/Header**

Pour les agents, ajoutez un lien vers le dashboard :

```javascript
{user?.role === 'agent' && (
  <Link to="/agent/dashboard">
    👨‍✈️ Dashboard Agent
  </Link>
)}
```

---

## ✅ Checklist d'Installation

- [ ] Ouvrir `SAE501-Web/flexitrip/src/App.js`
- [ ] Ajouter les 5 imports de composants en haut
- [ ] Ajouter les 5 nouvelles routes dans `<Routes>`
- [ ] Sauvegarder le fichier
- [ ] Redémarrer le serveur frontend (`npm start`)
- [ ] Tester chaque route dans le navigateur

---

## 🧪 Tests Rapides

Une fois les routes ajoutées, testez :

```bash
# 1. Check-in
http://localhost:3000/user/checkin/1

# 2. Historique wallet
http://localhost:3000/user/wallet/history

# 3. Feedback
http://localhost:3000/feedback/1

# 4. Tracking
http://localhost:3000/user/tracking/1

# 5. Dashboard agent
http://localhost:3000/agent/dashboard
```

Si l'une des URLs renvoie "404" ou une page blanche :
1. Vérifiez que l'import est correct
2. Vérifiez que la route est bien ajoutée
3. Vérifiez que le chemin du composant est correct
4. Redémarrez le frontend

---

## 🚨 Erreurs Courantes

### **Erreur : "Module not found"**
```
Solution : Vérifier le chemin d'import
Exemple correct : './components/Wallet/WalletHistory'
```

### **Erreur : "Cannot read property 'user_id' of undefined"**
```
Solution : S'assurer que l'utilisateur est connecté
Login : admin@flexitrip.com / admin123
```

### **Erreur : "404 on API call"**
```
Solution : Vérifier que le backend est démarré
docker-compose ps
docker logs flexitrip_api
```

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier la console navigateur (F12)
2. Vérifier les logs backend (`docker logs flexitrip_api`)
3. Vérifier que tous les fichiers sont créés
4. Redémarrer frontend et backend

---

**Après avoir ajouté ces routes, toutes les fonctionnalités seront accessibles !** 🎉
