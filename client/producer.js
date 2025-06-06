/**
 * Producteur de tâches : envoie des opérations de calcul vers les workers via RabbitMQ.
 */

import { randomInt } from "crypto";
import { connect, log, sleep } from "./utils.js";

const SEND_EVERY = +process.env.PRODUCER_MS || 2_000; // 2 s (plus fréquent)
const OPERATIONS = ["add", "sub", "mul", "div", "all"]; // Inclut 'all' pour la sélection
const WORKER_OPERATIONS = ["add", "sub", "mul", "div"]; // Types de workers disponibles

/**
 * Retourne une opération aléatoire parmi celles disponibles.
 * @returns {string} Opération choisie.
 */
const getRandomOperation = () => OPERATIONS[randomInt(0, OPERATIONS.length)];

(async () => {
  const conn = await connect("producer");
  const channels = {};

  // Création des canaux et des files pour chaque type de worker
  for (const op of WORKER_OPERATIONS) {
    const ch = await conn.createChannel();
    const queueName = `tasks_${op}`;
    await ch.assertQueue(queueName, { durable: true });
    channels[op] = { channel: ch, queue: queueName };
  }

  process.on("SIGINT", () => {
    log("producer", "bye");
    process.exit();
  });

  log(
    "producer",
    `Envoi de calculs aléatoires toutes les ${
      SEND_EVERY / 1000
    }s (Ctrl-C pour quitter)`
  );

  for (;;) {
    const selectedOperation = getRandomOperation();

    if (selectedOperation === "all") {
      // Pour 'all', choisir une opération de calcul aléatoire et l'envoyer à tous les workers
      const calculationOp =
        WORKER_OPERATIONS[randomInt(0, WORKER_OPERATIONS.length)];
      const msg = {
        n1: randomInt(1, 101),
        n2: randomInt(1, 101),
        op: calculationOp,
      };

      log(
        "producer",
        `Message "all" envoyé à tous les workers : ${JSON.stringify(msg)}`
      );

      // Envoi du même message à toutes les files de workers
      for (const workerOp of WORKER_OPERATIONS) {
        const { channel, queue } = channels[workerOp];
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
          persistent: true,
        });
      }
    } else {
      // Envoi classique à la file spécifique à l'opération
      const msg = {
        n1: randomInt(1, 101),
        n2: randomInt(1, 101),
        op: selectedOperation,
      };

      const { channel, queue } = channels[selectedOperation];
      channel.sendToQueue(queue, Buffer.from(JSON.stringify(msg)), {
        persistent: true,
      });

      log("producer", `Message envoyé : ${JSON.stringify(msg)}`);
    }

    await sleep(SEND_EVERY);
  }
})();
