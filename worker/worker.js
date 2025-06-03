import { randomInt } from 'crypto';
import { connect, log, sleep } from '../utils.js';

const TASKS = process.env.QUEUE || 'tasks';
const OUTPUT = process.env.RESULTS || 'results';

(async () => {
  const conn = await connect('worker');
  const ch = await conn.createChannel();
  await Promise.all([
    ch.assertQueue(TASKS, { durable: true }),
    ch.assertQueue(OUTPUT, { durable: true }),
  ]);
  await ch.prefetch(1);

  process.on('SIGINT', () => {
    log('worker', 'bye');
    process.exit();
  });

  log('worker', 'attente de tâches (Ctrl-C pour quitter)');
  ch.consume(TASKS, async (msg) => {
    if (!msg) return;

    const { n1, n2 } = JSON.parse(msg.content);
    const delay = randomInt(5, 16) * 1000;
    log('worker', `reçu ${n1}+${n2} → pause ${delay / 1000}s`);
    await sleep(delay);

    const result = { n1, n2, op: 'add', result: n1 + n2 };
    ch.sendToQueue(OUTPUT, Buffer.from(JSON.stringify(result)), {
      persistent: true,
    });
    ch.ack(msg);
    log('worker', `✔ ${result.result}`);
  });
})();
