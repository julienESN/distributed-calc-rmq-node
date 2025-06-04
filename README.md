# 🐇 Distributed Calc RMQ

**Calcul distribué asynchrone avec Node.js & RabbitMQ**  
Un projet pédagogique, modulaire et scalable pour découvrir la programmation distribuée, la file de messages RabbitMQ et la montée en charge des microservices.

---

## 🚀 Présentation

Ce projet met en œuvre une architecture de calcul distribué :

- Un **producteur** envoie des tâches de calcul (addition, soustraction, multiplication, division) dans des files RabbitMQ.
- Plusieurs **workers** consomment ces tâches, effectuent les calculs, puis publient les résultats.
- Un **consommateur** centralise et affiche les résultats.

Le tout est orchestré via Docker Compose pour une prise en main rapide et une montée en charge facile.

---

## 🏗️ Architecture générale

```
+-----------+        +-------------------+        +--------------+
|           |        |                   |        |              |
| Producer  +------->+  RabbitMQ Broker  +<-------+   Consumer   |
|           |        |                   |        |              |
+-----+-----+        +---------+---------+        +--------------+
      |                        ^
      |                        |
      v                        |
+-----+-----+        +---------+---------+
|           |        |                   |
|  Worker   +<-------+  Worker (xN)      |
|  (add)    |        |  (sub/mul/div)    |
+-----------+        +-------------------+
```

---

## 🔄 Diagramme de flux d'une tâche

```
1. Le Producer génère une tâche de calcul (ex: addition).
2. Il l'envoie dans la queue RabbitMQ dédiée (ex: tasks_add).
3. Le Worker correspondant (ex: worker-add) consomme la tâche, effectue le calcul.
4. Le Worker publie le résultat dans la queue "results".
5. Le Consumer lit la queue "results" et affiche le résultat.

Exemple de flux :
Producer → [tasks_add] → Worker-ADD → [results] → Consumer
        → [tasks_sub] → Worker-SUB → [results] → Consumer
        → [tasks_mul] → Worker-MUL → [results] → Consumer
        → [tasks_div] → Worker-DIV → [results] → Consumer
```

---

## ✨ Améliorations et points forts

### 1. Workers spécialisés par opération

- **worker-add** : Addition
- **worker-sub** : Soustraction
- **worker-mul** : Multiplication
- **worker-div** : Division (avec protection contre la division par zéro)

Chaque worker :

- Accepte un paramètre d'opération en ligne de commande
- Ne traite que les tâches de sa catégorie spécifique
- Utilise une queue dédiée (`tasks_add`, `tasks_sub`, `tasks_mul`, `tasks_div`)

### 2. Producer amélioré

- Envoie des requêtes de calcul de tous types (add, sub, mul, div) de façon aléatoire
- Fréquence augmentée : envoi toutes les 2 secondes (au lieu de 5)
- Routage automatique vers la bonne queue selon l'opération
- Affichage amélioré avec symboles mathématiques

### 3. Architecture multi-workers

Le `docker-compose.yml` démarre maintenant :

- 1 instance RabbitMQ avec interface de gestion
- 1 producer qui génère des tâches aléatoirement
- 4 workers spécialisés (un par opération)
- 1 consumer qui affiche tous les résultats

### 4. Scalabilité et résilience

- **Scalabilité** : ajoute ou retire des workers à chaud selon la charge.
- **Résilience** : reconnexion automatique à RabbitMQ en cas de coupure.
- **Extensible** : ajoute facilement de nouveaux types de calculs ou de traitements.
- **100% Node.js** : code simple, moderne, commenté et pédagogique.
- **Prêt à l'emploi** : déploiement instantané avec Docker Compose.

---

## 🛠️ Fonctionnement technique détaillé

### Producteur (`client/producer.js`)

- Génère des opérations de calcul aléatoires.
- Envoie les tâches dans les files RabbitMQ dédiées à chaque type d'opération.
- Peut envoyer un message à tous les workers ou cibler une opération spécifique.

### Workers (`worker/worker.js`)

- Chaque worker écoute une file spécifique (add, sub, mul, div).
- Récupère la tâche, effectue le calcul, simule un délai, publie le résultat.
- Protection contre la division par zéro pour le worker de division.

### Consommateur (`consumer/consumer.js`)

- Écoute la file des résultats.
- Affiche chaque résultat reçu.

### Gestion des erreurs et de la connexion

- Reconnexion automatique à RabbitMQ en cas de perte de connexion.
- Nombre de tentatives et délai configurables via variables d'environnement.

---

## 📦 Variables d'environnement

Créez un fichier `.env` à la racine avec :

```env
# Configuration RabbitMQ
AMQP_URL=amqp://guest:guest@rabbitmq:5672
MAX_RETRIES=30
RETRY_DELAY=5000

# Configuration Producer
PRODUCER_MS=2000

# Configuration des queues
RESULTS=results
```

---

## ⚡️ Démarrage rapide

### Prérequis

- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- (Optionnel) Node.js ≥ 18 si tu veux lancer les scripts en local

### Lancer toute l'architecture (recommandé)

```bash
docker-compose up --build
```

- Le producteur envoie des tâches toutes les 2 secondes.
- Les workers traitent les tâches et publient les résultats.
- Le consommateur affiche les résultats en temps réel.

### Ajouter des workers (scalabilité)

Pour simuler la montée en charge, lance plusieurs workers :

```bash
docker-compose up --scale worker_add=3 --scale worker_sub=2
```

### Lancer les composants individuellement (hors Docker)

**Producer :**

```bash
cd client
node producer.js
```

**Worker spécialisé :**

```bash
cd worker
node worker.js add    # Pour les additions
node worker.js sub    # Pour les soustractions
node worker.js mul    # Pour les multiplications
node worker.js div    # Pour les divisions
```

**Consumer :**

```bash
cd consumer
node consumer.js
```

---

## 🗂️ Structure du projet

```
distributed-calc-rmq-node/
│
├── client/      # Producteur de tâches
│   └── producer.js
│   └── utils.js
│
├── worker/      # Workers de calcul (add, sub, mul, div)
│   └── worker.js
│   └── utils.js
│
├── consumer/    # Consommateur de résultats
│   └── consumer.js
│   └── utils.js
│
├── utils.js     # Utilitaires partagés
├── docker-compose.yml
└── README.md
```

---

## 🖥️ Interface de gestion RabbitMQ

Accédez à l'interface de gestion RabbitMQ sur : [http://localhost:15672](http://localhost:15672)

- Username: `guest`
- Password: `guest`

Vous pourrez y voir :

- Les 4 queues de tâches (`tasks_add`, `tasks_sub`, `tasks_mul`, `tasks_div`)
- La queue de résultats (`results`)
- Le trafic de messages en temps réel

---

## 📣 Pourquoi utiliser ce projet ?

- Pour apprendre RabbitMQ et la programmation distribuée de façon concrète.
- Pour tester la scalabilité et la tolérance aux pannes d'une architecture microservices.
- Pour disposer d'un socle simple et réutilisable dans des projets plus complexes.

---

**Prêt à scaler tes calculs ? Lance-toi ! 🚀**
