import amqp from 'amqplib';

const AMQP_URL = 'amqp://user:password@localhost:5672';

const RESULTS = 'results';

const conn = await amqp.connect(AMQP_URL);
const ch = await conn.createChannel();
await ch.assertQueue(RESULTS, { durable: true });

console.log('[consumer] écoute les résultats - Ctrl-C pour quitter');
ch.consume(RESULTS, (msg) => {
  if (!msg) return;
  console.log('[consumer] résultat :', msg.content.toString());
  ch.ack(msg);
});
