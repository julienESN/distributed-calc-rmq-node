# Distributed Calc – RabbitMQ + Node.js

Mini-POC de calcul distribué pour l'Institut NGI.

---

## 📦 Fonctionnement

Trois scripts communiquent via RabbitMQ :

- `producer.js` : génère aléatoirement deux nombres toutes les 5 secondes et les envoie dans une queue (`tasks`)
- `worker.js` : consomme les tâches, effectue la somme avec un délai simulé (5 à 15 s), et renvoie le résultat
- `consumer.js` : écoute une deuxième queue (`results`) pour afficher les résultats au fil de l'eau

---

## 🚀 Lancer la démo (en local avec Docker)

```bash
git clone https://github.com/julienESN/distributed-calc-rmq-node
cd distributed-calc-rmq-node

# 1. Lancer RabbitMQ avec interface web (localhost:15672)
docker compose up -d

# 2. Installer les dépendances Node.js
npm install

# 3. Copier le fichier d'exemple de configuration
cp .env.example .env

# 4. Lancer les scripts dans trois terminaux
npm run consumer   # terminal 1
npm run worker     # terminal 2 (relancer plusieurs fois si souhaité)
npm run producer   # terminal 3
```

---

## 🔁 Lancer automatiquement les 3 scripts (Windows)

Utilisez le script `start-all.bat` :

```bash
start start-all.bat
```

## 🔁 Configuration (fichier .env)

```bash
AMQP_URL=amqp://guest:guest@localhost:5672
QUEUE=tasks
RESULTS=results
```
