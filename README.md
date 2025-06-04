# Projet RabbitMQ - Calculateur Distribué

## Améliorations Apportées

### 1. Workers Spécialisés par Opération

Le système a été amélioré pour supporter 4 types de workers spécialisés :
- **worker-add** : Addition
- **worker-sub** : Soustraction  
- **worker-mul** : Multiplication
- **worker-div** : Division (avec protection contre la division par zéro)

Chaque worker :
- Accepte un paramètre d'opération en ligne de commande
- Ne traite que les tâches de sa catégorie spécifique
- Utilise une queue dédiée (`tasks_add`, `tasks_sub`, `tasks_mul`, `tasks_div`)

### 2. Producer Amélioré

Le client producer a été amélioré pour :
- Envoyer des requêtes de calcul de tous types (add, sub, mul, div) de façon aléatoire
- Fréquence augmentée : envoi toutes les 2 secondes (au lieu de 5)
- Routage automatique vers la bonne queue selon l'opération
- Affichage amélioré avec symboles mathématiques

### 3. Architecture Multi-Workers

Le `docker-compose.yml` démarre maintenant :
- 1 instance RabbitMQ avec interface de gestion
- 1 producer qui génère des tâches aléatoirement
- 4 workers spécialisés (un par opération)
- 1 consumer qui affiche tous les résultats

## Utilisation

### Démarrage complet avec Docker Compose
```bash
docker-compose up --build
```

### Démarrage manuel d'un worker spécialisé
```bash
cd worker
node worker.js add    # Pour les additions
node worker.js sub    # Pour les soustractions
node worker.js mul    # Pour les multiplications
node worker.js div    # Pour les divisions
```

### Variables d'environnement

Créez un fichier `.env` à la racine avec :
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

## Interface de Gestion RabbitMQ

Accédez à l'interface de gestion RabbitMQ sur : http://localhost:15672
- Username: `guest`
- Password: `guest`

Vous pourrez y voir :
- Les 4 queues de tâches (`tasks_add`, `tasks_sub`, `tasks_mul`, `tasks_div`)
- La queue de résultats (`results`)
- Le trafic de messages en temps réel

## Architecture

```
Producer → [tasks_add] → Worker-ADD → [results] → Consumer
        → [tasks_sub] → Worker-SUB → [results] → Consumer
        → [tasks_mul] → Worker-MUL → [results] → Consumer  
        → [tasks_div] → Worker-DIV → [results] → Consumer
``` 