import amqp from 'amqplib';
import dotenv from 'dotenv';
import { randomInt } from 'crypto';

dotenv.config();

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@rabbitmq:5672';
const TASKS = process.env.QUEUE || 'tasks';
const RESULTS = process.env.RESULTS || 'results';
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 5000; // 5 secondes

async function connectWithRetry() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`[worker] Tentative de connexion à RabbitMQ (${retries + 1}/${MAX_RETRIES})...`);
      const conn = await amqp.connect(AMQP_URL);
      console.log('[worker] Connecté à RabbitMQ');
      
      conn.on('error', (err) => {
        console.error('[worker] Erreur de connexion:', err);
        if (err.code === 'ECONNREFUSED') {
          console.log('[worker] Tentative de reconnexion...');
          setTimeout(connectWithRetry, RETRY_INTERVAL);
        }
      });

      conn.on('close', () => {
        console.log('[worker] Connexion fermée, tentative de reconnexion...');
        setTimeout(connectWithRetry, RETRY_INTERVAL);
      });

      const ch = await conn.createChannel();
      await ch.assertQueue(TASKS, { durable: true });
      await ch.assertQueue(RESULTS, { durable: true });
      await ch.prefetch(1); // 1 tâche à la fois par worker

      console.log('[worker] En attente de tâches - Ctrl-C pour quitter');

      ch.consume(TASKS, async (msg) => {
        if (!msg) return;

        const task = JSON.parse(msg.content.toString());
        const delay = randomInt(5, 16) * 1000;

        console.log(`[worker] Tâche reçue: ${task.n1} + ${task.n2}, pause ${delay / 1000}s`);
        await new Promise((r) => setTimeout(r, delay));

        const result = {
          n1: task.n1,
          n2: task.n2,
          op: 'add',
          result: task.n1 + task.n2,
        };

        ch.sendToQueue(RESULTS, Buffer.from(JSON.stringify(result)), {
          persistent: true,
        });

        ch.ack(msg);
        console.log(`[worker] Résultat envoyé: ${result.result}`);
      });

      return;
    } catch (err) {
      console.error(`[worker] Erreur de connexion (tentative ${retries + 1}/${MAX_RETRIES}):`, err.message);
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`[worker] Nouvelle tentative dans ${RETRY_INTERVAL/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      } else {
        console.error('[worker] Nombre maximum de tentatives atteint. Arrêt du service.');
        process.exit(1);
      }
    }
  }
}

// Démarrage du service
connectWithRetry().catch(err => {
  console.error('[worker] Erreur fatale:', err);
  process.exit(1);
});
