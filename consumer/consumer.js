import amqp from 'amqplib';
import dotenv from 'dotenv';

dotenv.config();

const AMQP_URL = process.env.AMQP_URL || 'amqp://guest:guest@rabbitmq:5672';
const RESULTS = process.env.RESULTS || 'results';
const MAX_RETRIES = 30;
const RETRY_INTERVAL = 5000; // 5 secondes

async function connectWithRetry() {
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      console.log(`[consumer] Tentative de connexion à RabbitMQ (${retries + 1}/${MAX_RETRIES})...`);
      const conn = await amqp.connect(AMQP_URL);
      console.log('[consumer] Connecté à RabbitMQ');
      
      conn.on('error', (err) => {
        console.error('[consumer] Erreur de connexion:', err);
        if (err.code === 'ECONNREFUSED') {
          console.log('[consumer] Tentative de reconnexion...');
          setTimeout(connectWithRetry, RETRY_INTERVAL);
        }
      });

      conn.on('close', () => {
        console.log('[consumer] Connexion fermée, tentative de reconnexion...');
        setTimeout(connectWithRetry, RETRY_INTERVAL);
      });

      const ch = await conn.createChannel();
      await ch.assertQueue(RESULTS, { durable: true });

      console.log('[consumer] Écoute des résultats - Ctrl-C pour quitter');
      ch.consume(RESULTS, (msg) => {
        if (!msg) return;
        console.log('[consumer] Résultat reçu:', msg.content.toString());
        ch.ack(msg);
      });

      return;
    } catch (err) {
      console.error(`[consumer] Erreur de connexion (tentative ${retries + 1}/${MAX_RETRIES}):`, err.message);
      retries++;
      if (retries < MAX_RETRIES) {
        console.log(`[consumer] Nouvelle tentative dans ${RETRY_INTERVAL/1000} secondes...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      } else {
        console.error('[consumer] Nombre maximum de tentatives atteint. Arrêt du service.');
        process.exit(1);
      }
    }
  }
}

// Démarrage du service
connectWithRetry().catch(err => {
  console.error('[consumer] Erreur fatale:', err);
  process.exit(1);
});
