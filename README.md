# Distributed Calc – RabbitMQ + Node.js

Mini-POC de calcul distribué pour l'Institut NGI.

## Lancer la démo

```bash
git clone https://github.com/<org>/distributed-calc-rmq-node.git
cd distributed-calc-rmq-node

# 1. Lancer RabbitMQ
docker compose up -d

# 2. Installer les dépendances
npm install

# 3. Dans trois terminaux séparés
npm run consumer   # affiche les résultats
npm run worker     # exécute le calcul (lancer plusieurs fois pour scaler)
npm run producer   # génère une requête toutes les 5 s
```
