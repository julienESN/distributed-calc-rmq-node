import amqp from 'amqplib';
import { randomInt } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@rabbitmq:5672';
const QUEUE = process.env.QUEUE || 'tasks';
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 5000; // 5 secondes
const PRODUCER_INTERVAL = 5000; // 5 secondes

let channel = null;
let intervalId = null;

async function startProducer(ch) {
  if (intervalId) {
    clearInterval(intervalId);
  }

  console.log('[producer] Envoi d\'un calcul toutes les 5s - Ctrl-C pour quitter');
  intervalId = setInterval(async () => {
    try {
      const n1 = randomInt(1, 101);
      const n2 = randomInt(1, 101);
      const msg = JSON.stringify({ n1, n2 });
      ch.sendToQueue(QUEUE, Buffer.from(msg), { persistent: true });
      console.log(`[producer] Message envoyé: ${msg}`);
    } catch (err) {
      console.error('[producer] Erreur lors de l\'envoi du message:', err);
    }
  }, PRODUCER_INTERVAL);
}

async function connectWithRetry() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`[producer] Tentative de connexion à RabbitMQ (${retries + 1}/${MAX_RETRIES})...`);
      const conn = await amqp.connect(AMQP_URL);
      console.log('[producer] Connecté à RabbitMQ');
      
      conn.on('error', (err) => {
        console.error('[producer] Erreur de connexion:', err);
        if (err.code === 'ECONNREFUSED') {
          console.log('[producer] Tentative de reconnexion...');
          setTimeout(connectWithRetry, RETRY_INTERVAL);
        }
      });

      conn.on('close', () => {
        console.log('[producer] Connexion fermée, tentative de reconnexion...');
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        setTimeout(connectWithRetry, RETRY_INTERVAL);
      });

      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      await startProducer(channel);

      return;
    } catch (err) {
      console.error(`[producer] Erreur de connexion (tentative ${retries + 1}/${MAX_RETRIES}):`, err.message);
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`[producer] Nouvelle tentative dans ${RETRY_INTERVAL/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      } else {
        console.error('[producer] Nombre maximum de tentatives atteint. Arrêt du service.');
        process.exit(1);
      }
    }
  }
}

// Nettoyage à l'arrêt
process.on('SIGINT', () => {
  if (intervalId) {
    clearInterval(intervalId);
  }
  process.exit(0);
});

// Démarrage du service
connectWithRetry().catch(err => {
  console.error('[producer] Erreur fatale:', err);
  process.exit(1);
});
