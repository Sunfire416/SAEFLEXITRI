# 📋 Guide de Configuration des Fichiers .env

## 🎯 Objectif

Ce système permet à chaque développeur d'avoir sa propre configuration locale sans conflits Git. Chaque personne garde ses propres valeurs (utilisateurs de test, IP locale, etc.) dans des fichiers séparés.

## 📁 Structure des fichiers

```
SAE501-API_Flexitrip/
├── .env.example          ✅ Template (commité dans Git)
├── .env.local.dev1       ❌ Votre config personnelle (ignoré par Git)
├── .env.local.dev2       ❌ Config de votre binôme (ignoré par Git)
├── .env                  ❌ Fichier actif utilisé par l'app (ignoré par Git)
└── copy-env.ps1 / .sh    ✅ Scripts pour copier la config (commités)
```

## 🚀 Configuration initiale

### Étape 1: Créer votre fichier de configuration personnelle

**Pour vous (Développeur 1):**

1. Copiez le template:
   ```powershell
   # Windows PowerShell
   Copy-Item .env.example .env.local.dev1
   ```

   ```bash
   # Mac/Linux
   cp .env.example .env.local.dev1
   ```

2. Ouvrez `.env.local.dev1` et personnalisez:
   - Modifiez `DEFAULT_USERS` avec vos propres utilisateurs de test
   - Changez `JWT_SECRET` par une clé unique pour vous
   - Ajustez les autres valeurs si nécessaire

**Pour votre binôme (Développeur 2):**

Votre binôme fait la même chose mais avec `.env.local.dev2`:
```powershell
Copy-Item .env.example .env.local.dev2
```

### Étape 2: Utiliser votre configuration

Avant de lancer Docker, copiez votre fichier de config vers `.env`:

**Windows PowerShell:**
```powershell
.\copy-env.ps1 dev1    # Pour vous
# ou
.\copy-env.ps1 dev2    # Pour votre binôme
```

**Mac/Linux:**
```bash
chmod +x copy-env.sh   # La première fois seulement
./copy-env.sh dev1     # Pour vous
# ou
./copy-env.sh dev2     # Pour votre binôme
```

### Étape 3: Lancer Docker

```powershell
docker-compose up -d
```

## 📝 Format des utilisateurs par défaut

Dans votre fichier `.env.local.dev1` ou `.env.local.dev2`, vous pouvez définir des utilisateurs qui seront créés automatiquement au démarrage.

### Format:
```
NAME|SURNAME|EMAIL|PHONE|PASSWORD|ROLE|ADDRESS|PMR_ASSISTANCE
```

### Exemple:
```
DEFAULT_USERS=Jean|Dupont|jean.dupont@test.com|0612345678|test123|PMR|123 Rue Test, Paris||
```

### Pour plusieurs utilisateurs:
Séparez-les par des virgules (sans espaces):
```
DEFAULT_USERS=Jean|Dupont|jean@test.com|0612345678|test123|PMR|123 Rue Test||,Marie|Martin|marie@test.com|0698765432|test456|Accompagnant|456 Avenue Test||
```

## 🔒 Sécurité

- ✅ Les fichiers `.env.local.*` sont **ignorés par Git** (défini dans `.gitignore`)
- ✅ Seul le template `.env.example` est commité (sans valeurs sensibles)
- ✅ Chaque développeur garde ses secrets locaux privés
- ⚠️ **Ne commitez JAMAIS** vos fichiers `.env.local.*` ou `.env`

## 🔄 Workflow quotidien

1. **Copier votre config:**
   ```powershell
   .\copy-env.ps1 dev1
   ```

2. **Lancer Docker:**
   ```powershell
   docker-compose up -d
   ```

3. **Vérifier que tout fonctionne:**
   ```powershell
   docker-compose ps
   docker-compose logs api
   ```

## ❓ Questions fréquentes

### Q: Comment savoir quel développeur je suis (dev1 ou dev2) ?
**R:** C'est vous qui décidez ! Généralement:
- Le premier développeur = dev1
- Le binôme = dev2

### Q: Que faire si je modifie mon fichier .env.local.dev1 ?
**R:** C'est normal, modifiez-le comme vous voulez. Il est ignoré par Git, donc pas de problème. Pensez juste à recopier vers `.env` avant de lancer Docker.

### Q: Puis-je partager ma config avec mon binôme ?
**R:** Oui, mais seulement si vous voulez tester la même config. Sinon, chacun garde sa config personnelle.

### Q: Les utilisateurs sont-ils créés à chaque démarrage ?
**R:** Non, seulement s'ils n'existent pas déjà. Si un utilisateur avec le même email existe, il sera ignoré (pas d'erreur).

## 📚 Fichiers créés

- ✅ `.env.example` - Template avec commentaires détaillés
- ✅ `.gitignore` - Mis à jour pour ignorer les .env
- ✅ `copy-env.ps1` - Script Windows PowerShell
- ✅ `copy-env.sh` - Script Mac/Linux
- ✅ `README_ENV.md` - Ce fichier de documentation

## 🆘 Problèmes courants

### Le script ne fonctionne pas
- Vérifiez que vous êtes dans le bon dossier (`SAE501-API_Flexitrip`)
- Vérifiez que le fichier `.env.local.dev1` ou `.env.local.dev2` existe
- Vérifiez les permissions d'exécution (Linux/Mac): `chmod +x copy-env.sh`

### Les utilisateurs ne sont pas créés
- Vérifiez que le fichier `.env` existe (copié depuis `.env.local.devX`)
- Vérifiez le format de `DEFAULT_USERS` (respectez le format exact)
- Vérifiez les logs Docker: `docker-compose logs api`

### Erreur de permission PowerShell
Si vous avez une erreur d'exécution de script PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

