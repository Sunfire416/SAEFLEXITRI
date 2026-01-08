FROM node:18

WORKDIR /app

# Copie uniquement les fichiers de dépendances pour éviter le cache inutile
COPY package*.json ./

# Force une réinstallation propre, y compris des dépendances natives
RUN npm install --build-from-source

# Copie le reste du code
COPY . .

EXPOSE 17777
CMD ["node", "app.js"]
