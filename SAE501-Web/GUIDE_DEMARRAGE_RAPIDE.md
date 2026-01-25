# 🚀 DÉMARRAGE RAPIDE - FlexiTrip Mode DEMO

## ⚡ Installation et lancement (2 minutes)

### 1. Installer les dépendances
```bash
cd SAE501-Web/flexitrip
npm install
```

### 2. Vérifier la configuration
```bash
# Vérifier que .env.local existe avec :
cat .env.local

# Doit contenir :
# REACT_APP_API_URL=http://localhost:17777
# REACT_APP_DEMO_MODE=true
```

### 3. Lancer l'application
```bash
npm start
```

L'application s'ouvre sur `http://localhost:3000`

---

## 🎯 Parcours de démonstration (3 minutes)

### Étape 1 : Connexion (30s)
1. Aller sur `/login`
2. Entrer : `pmr@demo.com` / `demo123`
3. Cliquer "Connexion"
4. ✅ Vérifier : Badge "DEMO" visible en haut à droite

### Étape 2 : Mon Trajet (1min)
1. Cliquer sur "Mon trajet" dans la navbar
2. ✅ Vérifier : Stepper 8 User Stories visible
3. ✅ Vérifier : 3 segments (Train/Bus/Avion) affichés
4. ✅ Vérifier : Agent "Claude Petit" sur segment Bus
5. Cliquer "J'approche" → ✅ Event apparaît en bas
6. Cliquer "Valider handover" → ✅ Segment passe en completed

### Étape 3 : Mes Voyages (30s)
1. Cliquer "Mon trajet" → Retour page voyage
2. Aller sur `/user/voyages` (menu profil)
3. ✅ Vérifier : Voyage Paris-Nice affiché
4. ✅ Vérifier : Stats en haut (1 voyage confirmé)

### Étape 4 : Bagages & Wallet (1min)
1. Aller sur `/user/bagages`
2. ✅ Vérifier : 2 bagages (FXT-BAG-001, FXT-BAG-002)
3. Cliquer sur un bagage → ✅ Timeline événements
4. Aller sur `/user/ewallet`
5. ✅ Vérifier : Solde 105€
6. ✅ Vérifier : Historique 4 transactions

---

## 🔧 Toggle Mode DEMO

### Activer DEMO
```javascript
// Console navigateur (F12)
localStorage.setItem('DEMO_MODE', 'true');
location.reload();
```

### Désactiver DEMO
```javascript
localStorage.removeItem('DEMO_MODE');
location.reload();
```

### Vérifier statut
- Badge "DEMO" visible = Mode actif
- Pas de badge = Mode normal (API réelle)

---

## ❌ Résolution problèmes courants

### Build warning "browserslist outdated"
```bash
npx update-browserslist-db@latest
npm run build
```

### Port 3000 déjà utilisé
```bash
# Changer le port dans package.json ou :
PORT=3001 npm start  # Linux/Mac
$env:PORT=3001; npm start  # Windows PowerShell
```

### "Module not found" après git pull
```bash
rm -rf node_modules package-lock.json
npm install
npm start
```

### API errors en mode normal
1. Vérifier que le backend tourne : `http://localhost:17777`
2. Vérifier `.env.local` : `REACT_APP_API_URL=http://localhost:17777`
3. Si backend down → Mode DEMO s'active automatiquement

---

## 📁 Structure des fichiers DEMO

```
src/
├── config/
│   └── demoConfig.js          ← Toggle DEMO
├── demo/
│   └── mockData.js            ← Données mock (400+ lignes)
├── api/
│   └── apiService.js          ← Wrapper avec fallback
└── pages/
    └── MonTrajet.js           ← Page principale DEMO

.env.local                      ← Config
CHECKLIST_TEST_DEMO.md          ← Tests manuels
RAPPORT_MIGRATION_DEMO.md       ← Documentation complète
```

---

## 📞 Commandes utiles

### Développement
```bash
npm start              # Dev server
npm run build          # Production build
npm test               # Tests (si configurés)
```

### Debugging
```bash
# Voir logs API
# Console navigateur → [DEMO MODE] GET /voyages/history

# Nettoyer localStorage
localStorage.clear();
```

### Reset complet
```bash
# Supprimer tout et recommencer
rm -rf node_modules package-lock.json .env.local
npm install
# Recréer .env.local avec contenu ci-dessus
npm start
```

---

## ✅ Vérification rapide (30 secondes)

```bash
# Dans la racine du projet
cd SAE501-Web/flexitrip

# Vérifier que ces fichiers existent :
ls src/config/demoConfig.js
ls src/demo/mockData.js
ls src/api/apiService.js
ls src/pages/MonTrajet.js
ls .env.local

# Si tous existent → ✅ Installation OK
# Lancer : npm start
```

---

## 🎓 Pour la démonstration prof

### Ouvrir 2 onglets en parallèle :
1. **Onglet 1** : `/mon-trajet` (stepper + segments)
2. **Onglet 2** : `/user/voyages` (liste voyages)

### Scénario de démo :
1. Montrer badge DEMO (cliquer pour toggle)
2. Montrer stepper 8 étapes sur Mon Trajet
3. Valider un handover → Observer progression
4. Aller sur Mes Voyages → Montrer données
5. Aller sur Bagages → Montrer timeline
6. (Bonus) Arrêter backend → Montrer fallback auto

**Durée totale : 3-5 minutes**

---

**📄 Voir aussi** :
- `CHECKLIST_TEST_DEMO.md` pour tests détaillés
- `RAPPORT_MIGRATION_DEMO.md` pour documentation complète
