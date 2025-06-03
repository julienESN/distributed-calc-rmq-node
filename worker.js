import amqp from 'amqplib';
import dotenv from 'dotenv';
import { randomInt } from 'crypto';

dotenv.config();

const AMQP_URL = process.env.AMQP_URL;
const TASKS = process.env.QUEUE || 'tasks';
const RESULTS = process.env.RESULTS || 'results';

const conn = await amqp.connect(AMQP_URL);
const ch = await conn.createChannel();

await ch.assertQueue(TASKS, { durable: true });
await ch.assertQueue(RESULTS, { durable: true });
await ch.prefetch(1); // 1 tâche à la fois par worker

console.log('[worker] en attente de tâches - Ctrl-C pour quitter');

ch.consume(TASKS, async (msg) => {
  if (!msg) return;

  const task = JSON.parse(msg.content.toString());
  const delay = randomInt(5, 16) * 1000;

  console.log(`[worker] reçu ${task.n1} + ${task.n2}, pause ${delay / 1000}s`);
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
  console.log(`[worker] résultat envoyé : ${result.result}`);
});
