import amqp from 'amqplib';
import { randomInt } from 'crypto';

const AMQP_URL = 'amqp://user:password@localhost:5672';

const QUEUE = 'tasks';

const conn = await amqp.connect(AMQP_URL);
const ch = await conn.createChannel();
await ch.assertQueue(QUEUE, { durable: true });

console.log('[producer] envoie un calcul toutes les 5 s - Ctrl-C pour quitter');
setInterval(async () => {
  const n1 = randomInt(1, 101);
  const n2 = randomInt(1, 101);
  const msg = JSON.stringify({ n1, n2 });
  ch.sendToQueue(QUEUE, Buffer.from(msg), { persistent: true });
  console.log(`[producer] sent ${msg}`);
}, 5000);
