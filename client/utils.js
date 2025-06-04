/**
 * Utilitaires pour la connexion à RabbitMQ et le logging (côté client).
 */

import amqp from "amqplib";
import dotenv from "dotenv";
dotenv.config();

/* ---------- Config ---------- */
const CFG = {
  url: process.env.AMQP_URL || "amqp://guest:guest@rabbitmq:5672",
  retries: +process.env.MAX_RETRIES || 30,
  delay: +process.env.RETRY_DELAY || 5_000, // ms
};

/* ---------- Helpers ---------- */

/**
 * Pause l'exécution pendant un certain nombre de millisecondes.
 * @param {number} ms - Durée en millisecondes.
 * @returns {Promise<void>}
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Affiche un message loggué avec horodatage et scope.
 * @param {string} scope - Contexte du message.
 * @param {string} msg - Message à afficher.
 */
export const log = (scope, msg) =>
  console.log(`[${new Date().toISOString()}][${scope}] ${msg}`);

/* ---------- Connexion avec retry ---------- */

/**
 * Tente de se connecter à RabbitMQ avec une logique de retry.
 * @param {string} [scope='service'] - Nom du service pour le logging.
 * @returns {Promise<amqp.Connection>} Connexion RabbitMQ.
 * @throws {Error} Si la connexion échoue après tous les essais.
 */
export async function connect(scope = "service") {
  for (let i = 1; i <= CFG.retries; i++) {
    try {
      log(scope, `connexion à RabbitMQ (tentative ${i}/${CFG.retries})`);
      const conn = await amqp.connect(CFG.url);
      conn.on("error", (err) => log(scope, `⚠️  ${err.message}`));
      conn.on("close", () => log(scope, "⚠️  connexion fermée"));
      log(scope, "✅ connecté");
      return conn;
    } catch (err) {
      log(
        scope,
        `échec (${err.message}), nouvelle tentative dans ${CFG.delay / 1000}s`
      );
      await sleep(CFG.delay);
    }
  }
  throw new Error(
    `${scope} : impossible de joindre RabbitMQ après ${CFG.retries} essais`
  );
}
