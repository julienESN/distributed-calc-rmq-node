import { randomInt } from 'crypto';
import { connect, log, sleep } from './utils.js';

const SEND_EVERY = +process.env.PRODUCER_MS || 2_000; // 2 s (plus fréquent)
const OPERATIONS = ['add', 'sub', 'mul', 'div'];

// Fonction pour obtenir une opération aléatoire
const getRandomOperation = () => OPERATIONS[randomInt(0, OPERATIONS.length)];

(async () => {
  const conn = await connect('producer');
  const channels = {};
  
  // Créer les canaux et queues pour chaque opération
  for (const op of OPERATIONS) {
    const ch = await conn.createChannel();
    const queueName = `tasks_${op}`;
    await ch.assertQueue(queueName, { durable: true });
    channels[op] = { channel: ch, queue: queueName };
  }

  process.on('SIGINT', () => {
    log('producer', 'bye');
    process.exit();
  });

  log(
    'producer',
    `Envoi de calculs aléatoires toutes les ${SEND_EVERY / 1000}s (Ctrl-C pour quitter)`
  );
  
  for (;;) {
    const operation = getRandomOperation();
    const msg = {
      n1: randomInt(1, 101),
      n2: randomInt(1, 101),
      op: operation
    };
    
    const { channel, queue } = channels[operation];
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
    });
    
    log('producer', `Message envoyé : ${JSON.stringify(msg)}`);
    await sleep(SEND_EVERY);
  }
})();
