import { connect, log } from '../utils.js';

const OUTPUT = process.env.RESULTS || 'results';

(async () => {
  const conn = await connect('consumer');
  const ch = await conn.createChannel();
  await ch.assertQueue(OUTPUT, { durable: true });

  process.on('SIGINT', () => {
    log('consumer', 'bye');
    process.exit();
  });

  log('consumer', 'écoute des résultats (Ctrl-C pour quitter)');
  ch.consume(OUTPUT, (msg) => {
    if (!msg) return;
    log('consumer', `⇦ ${msg.content.toString()}`);
    ch.ack(msg);
  });
})();
