# 🔧 GUIDE DE DÉBOGAGE - Erreur Token Manquant

## ✅ Correctifs Appliqués

J'ai corrigé le problème d'authentification dans MultimodalSearch.js :

### Modifications effectuées :
1. ✅ Ajout du token JWT dans l'appel `workflow-preview`
2. ✅ Vérification du token avant toute requête
3. ✅ Logs de diagnostic dans la console
4. ✅ Messages d'erreur améliorés
5. ✅ Redirection automatique vers login si token invalide

---

## 🧪 Comment Tester Maintenant

### 1. Rechargez la page frontend
```
Appuyez sur Ctrl+Shift+R dans le navigateur
(hard refresh pour recharger le code React)
```

### 2. Vérifiez votre connexion
```
1. Allez sur http://localhost:3000/login
2. Connectez-vous avec vos identifiants
3. Vérifiez que vous êtes bien redirigé après connexion
```

### 3. Vérifiez le token dans le localStorage
```
Dans la console du navigateur (F12), tapez :
localStorage.getItem('token')

Vous devriez voir un long string JWT (3 parties séparées par des points)
Exemple : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lk...

Si c'est null ou undefined, reconnectez-vous !
```

### 4. Testez la réservation
```
1. Allez sur http://localhost:3000/user/search
2. Recherchez Paris → Lyon
3. Cliquez sur "🎫 Réserver ce trajet"
4. Regardez la console (F12) pour les logs
```

---

## 📊 Logs à surveiller dans la Console

Quand vous cliquez sur "Réserver", vous devriez voir :

```
🔑 Token récupéré: Présent (eyJhbGciOiJIUzI1NiIs...)
📋 Appel workflow-preview avec token...
✅ Workflow reçu: { workflow_type: 'LIGHT', required_steps: [...] }
```

Si vous voyez :
```
🔑 Token récupéré: ❌ ABSENT
```
→ Reconnectez-vous !

---

## 🐛 Problèmes Courants

### Erreur : "Token manquant"
**Cause :** Vous n'êtes pas connecté ou le token a été supprimé
**Solution :**
```
1. Allez sur http://localhost:3000/login
2. Reconnectez-vous
3. Vérifiez : localStorage.getItem('token')
```

---

### Erreur : "Token invalide ou expiré"
**Cause :** Le token JWT a expiré (durée de vie : généralement 24h)
**Solution :**
```
1. Reconnectez-vous pour obtenir un nouveau token
2. Si le problème persiste, vérifiez JWT_SECRET dans .env backend
```

---

### Erreur : "Session expirée"
**Cause :** Token expiré
**Solution :**
```
Le système vous redirige automatiquement vers /login après 2 secondes
Reconnectez-vous simplement
```

---

### Erreur : "Impossible de contacter le serveur"
**Cause :** Backend pas démarré ou problème réseau
**Solution :**
```bash
# Vérifier que le backend tourne
curl http://localhost:17777/api/health
# ou
curl http://localhost:17777/api-docs

# Si ça ne répond pas, redémarrer :
cd SAE501-API_Flexitrip
docker-compose restart
```

---

## 🔍 Diagnostic Complet

### Vérifier l'authentification backend
```bash
# Tester l'endpoint de login
curl -X POST http://localhost:17777/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "votre_username",
    "password": "votre_password"
  }'

# Vous devriez recevoir :
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": { ... }
}
```

### Tester l'API de booking avec token
```bash
# Remplacez YOUR_TOKEN par votre token JWT
curl -X POST http://localhost:17777/api/booking/workflow-preview \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "itinerary": {
      "transport_mode": "train",
      "distance_km": 400,
      "has_flight": false,
      "is_international": false
    }
  }'

# Vous devriez recevoir :
{
  "success": true,
  "workflow": { ... }
}
```

---

## 🔐 Vérifier la Configuration Backend

### 1. Vérifier JWT_SECRET dans .env
```bash
cd SAE501-API_Flexitrip
cat .env | grep JWT_SECRET

# Devrait afficher quelque chose comme :
JWT_SECRET=votre-secret-super-securise
```

### 2. Vérifier le middleware auth.js
```bash
cd SAE501-API_Flexitrip/middleware
cat auth.js | grep JWT_SECRET

# Devrait utiliser :
const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
```

### 3. Vérifier que les routes booking utilisent le middleware
```bash
cd SAE501-API_Flexitrip/routes
cat bookingRoutes.js | grep authMiddleware

# Devrait avoir :
router.use(authMiddleware);
```

---

## 📝 Checklist de Résolution

- [ ] Frontend rechargé (Ctrl+Shift+R)
- [ ] Utilisateur connecté via /login
- [ ] Token présent dans localStorage (F12 console)
- [ ] Backend en cours d'exécution (docker ps)
- [ ] Logs backend sans erreur (docker-compose logs -f)
- [ ] Console frontend affiche "🔑 Token récupéré: Présent"
- [ ] Pas d'erreur CORS dans la console
- [ ] Endpoint /api/booking/workflow-preview accessible avec token

---

## 🎯 Test Final

Une fois tous les correctifs appliqués :

```
1. ✅ Rechargez la page (Ctrl+Shift+R)
2. ✅ Connectez-vous si nécessaire
3. ✅ Allez sur /user/search
4. ✅ Cherchez Paris → Lyon
5. ✅ Cliquez "🎫 Réserver ce trajet"
6. ✅ Vérifiez la console : "🔑 Token récupéré: Présent"
7. ✅ La popup de confirmation devrait s'afficher
8. ✅ Confirmez la réservation
9. ✅ Vous devriez être redirigé vers /user/booking-result
```

---

## 💡 Astuce : Garder la Session Active

Pour éviter les expirations de token :

### Option 1 : Augmenter la durée du token (Backend)
```javascript
// Dans le fichier de génération de token (généralement routes/AuthRoutes.js)
const token = jwt.sign(
    { user_id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 jours au lieu de 24h
);
```

### Option 2 : Refresh token automatique (Frontend)
```javascript
// Ajouter dans AuthContext.js un système de refresh
// Avant chaque requête, vérifier si le token expire bientôt
// et le renouveler automatiquement
```

---

## 🚨 Si Rien ne Fonctionne

### Réinitialisation Complète

```bash
# 1. Arrêter tout
cd SAE501-API_Flexitrip
docker-compose down

# 2. Nettoyer localStorage (dans console navigateur F12)
localStorage.clear()

# 3. Redémarrer backend
cd SAE501-API_Flexitrip
docker-compose up -d

# 4. Redémarrer frontend (Ctrl+C puis)
cd SAE501-Web/flexitrip
npm start

# 5. Nouvelle connexion propre
# Allez sur http://localhost:3000/login
# Connectez-vous
# Testez la réservation
```

---

## 📞 Support

Si le problème persiste :

1. Vérifiez les logs backend :
```bash
docker-compose logs -f | grep -i "auth\|token\|booking"
```

2. Vérifiez la console frontend (F12)

3. Testez l'API directement avec Swagger :
```
http://localhost:17777/api-docs
```

4. Vérifiez que l'utilisateur existe dans la DB :
```bash
docker exec -it mysql_db mysql -u root -p
# Mot de passe : rootpassword

USE flexitrip_db;
SELECT user_id, username, email, wallet_balance FROM Users;
```

---

**Le système devrait maintenant fonctionner correctement !**

Rechargez la page et réessayez. Les logs dans la console vous guideront. 🚀
