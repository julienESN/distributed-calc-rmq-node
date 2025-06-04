import { randomInt } from 'crypto';
import { connect, log, sleep } from './utils.js';

// Récupérer l'opération depuis les arguments de la ligne de commande
const OPERATION = process.argv[2] || 'add';
const TASKS_QUEUE = `tasks_${OPERATION}`;
const OUTPUT = process.env.RESULTS || 'results';

// Fonctions de calcul
const operations = {
  add: (n1, n2) => n1 + n2,
  sub: (n1, n2) => n1 - n2,
  mul: (n1, n2) => n1 * n2,
  div: (n1, n2) => n2 !== 0 ? n1 / n2 : 'Division par zéro'
};

(async () => {
  const conn = await connect(`worker-${OPERATION}`);
  const ch = await conn.createChannel();
  await Promise.all([
    ch.assertQueue(TASKS_QUEUE, { durable: true }),
    ch.assertQueue(OUTPUT, { durable: true }),
  ]);
  await ch.prefetch(1);

  process.on('SIGINT', () => {
    log(`worker-${OPERATION}`, 'bye');
    process.exit();
  });

  log(`worker-${OPERATION}`, `Attente de tâches ${OPERATION} (Ctrl-C pour quitter)`);
  ch.consume(TASKS_QUEUE, async (msg) => {
    if (!msg) return;

    const { n1, n2, op } = JSON.parse(msg.content);
    
    // Vérifier que l'opération correspond à ce worker
    if (op !== OPERATION) {
      log(`worker-${OPERATION}`, `⚠️  opération incorrecte: ${op}, ignorée`);
      ch.ack(msg);
      return;
    }

    log(`worker-${OPERATION}`, `Message reçu : ${msg.content.toString()}`);
    
    const delay = randomInt(5, 16) * 1000;
    log(`worker-${OPERATION}`, `Pause de ${delay / 1000}s`);
    await sleep(delay);

    const calculation = operations[op];
    const resultValue = calculation(n1, n2);
    
    const result = { n1, n2, op, result: resultValue };
    ch.sendToQueue(OUTPUT, Buffer.from(JSON.stringify(result)), {
      persistent: true,
    });
    ch.ack(msg);
    log(`worker-${OPERATION}`, `Résultat : ${resultValue}`);
  });
})();
