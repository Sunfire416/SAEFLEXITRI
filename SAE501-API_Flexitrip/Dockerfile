FROM node:20

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Install propre dans le conteneur (Linux) – pas besoin de build-from-source ici
RUN npm install

# Copie du reste du code
COPY . .

ENV NODE_ENV=production

EXPOSE 17777

CMD ["node", "app.js"]
