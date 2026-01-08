# 📝 Instructions pour créer les fichiers .env

## ⚠️ Important

Les fichiers `.env` ne peuvent pas être créés automatiquement car ils sont dans `.gitignore` (c'est normal, ils contiennent des secrets). Vous devez les créer **manuellement** en suivant ces instructions.

## 🚀 Création des fichiers

### Étape 1: Créer le fichier template (déjà fait normalement)

Le fichier `.env.example` devrait déjà exister avec tous les commentaires détaillés.

### Étape 2: Créer votre fichier de configuration personnelle

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

2. Ouvrez `.env.local.dev1` avec un éditeur de texte (VS Code, Notepad++, etc.)

3. **Personnalisez les valeurs:**
   - Modifiez `DEFAULT_USERS` avec vos propres utilisateurs de test
   - Changez `JWT_SECRET` par une clé unique
   - Les autres valeurs peuvent rester par défaut si vous utilisez Docker

**Exemple de `DEFAULT_USERS` personnalisé:**
```
DEFAULT_USERS=VotreNom|VotrePrenom|votre.email@test.com|+33123456789|password123|PMR|123 Votre Rue, Paris||
```

### Étape 3: Votre binôme fait pareil

Votre binôme crée son propre fichier:
```powershell
Copy-Item .env.example .env.local.dev2
```

Puis il personnalise `.env.local.dev2` avec ses propres valeurs.

### Étape 4: Utiliser votre configuration

Avant de lancer Docker, utilisez le script pour copier votre config:

```powershell
# Windows PowerShell
.\copy-env.ps1 dev1    # Pour vous
```

```bash
# Mac/Linux
chmod +x copy-env.sh
./copy-env.sh dev1     # Pour vous
```

### Étape 5: Vérifier

Le script créera automatiquement le fichier `.env` à partir de votre `.env.local.dev1`.

Vous pouvez vérifier:
```powershell
# Windows PowerShell
Get-Content .env
```

```bash
# Mac/Linux
cat .env
```

## ✅ Checklist

- [ ] Fichier `.env.example` existe (avec tous les commentaires)
- [ ] Fichier `.env.local.dev1` créé et personnalisé (pour vous)
- [ ] Fichier `.env.local.dev2` créé et personnalisé (pour votre binôme)
- [ ] Script `copy-env.ps1` ou `copy-env.sh` fonctionne
- [ ] Fichier `.env` créé après avoir exécuté le script
- [ ] Tous les fichiers `.env.*` sont bien dans `.gitignore`

## 📋 Contenu minimal du fichier .env.local.dev1

Voici un exemple minimal si vous voulez créer le fichier manuellement:

```env
DB_USER=root
DB_PASSWORD=root
DB_HOST=flexitrip_mysql
DB_NAME=SAE_Multi
REDIS_HOST=flexitrip_redis
REDIS_PORT=6379
KAFKA_BROKER=kafka:9092
MONGO_URI=mongodb://retro0970:w9fuKaxzFWGMPlAh@cluster.qmrpxnx.mongodb.net/flexitrip?retryWrites=true&w=majority
JWT_SECRET=votre-cle-secrete-ici
PORT=17777
DEFAULT_USERS=VotreNom|VotrePrenom|votre.email@test.com|+33123456789|password123|PMR|123 Rue Test, Paris||
```

## 🆘 Si les fichiers .env ne sont pas créés

Si le script ne fonctionne pas ou si vous préférez créer les fichiers manuellement:

1. **Créez `.env.local.dev1`** avec le contenu ci-dessus (personnalisé)
2. **Copiez-le manuellement vers `.env`**:
   ```powershell
   # Windows PowerShell
   Copy-Item .env.local.dev1 .env
   ```
   ```bash
   # Mac/Linux
   cp .env.local.dev1 .env
   ```

C'est tout ! Le fichier `.env` sera utilisé automatiquement par l'application.
