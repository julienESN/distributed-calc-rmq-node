import { randomInt } from 'crypto';
import { connect, log, sleep } from '../utils.js';

const QUEUE = process.env.QUEUE || 'tasks';
const SEND_EVERY = +process.env.PRODUCER_MS || 5_000; // 5 s

(async () => {
  const conn = await connect('producer');
  const ch = await conn.createChannel();
  await ch.assertQueue(QUEUE, { durable: true });

  process.on('SIGINT', () => {
    log('producer', 'bye');
    process.exit();
  });

  log(
    'producer',
    `envoi toutes les ${SEND_EVERY / 1000}s (Ctrl-C pour quitter)`
  );
  for (;;) {
    const msg = {
      n1: randomInt(1, 101),
      n2: randomInt(1, 101),
    };
    ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(msg)), {
      persistent: true,
    });
    log('producer', `→ ${JSON.stringify(msg)}`);
    await sleep(SEND_EVERY);
  }
})();
