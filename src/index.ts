import { App, GenericMessageEvent } from "@slack/bolt";
import * as dotenv from "dotenv";
import express from "express";
import fs from "fs";
import { fromKeyLike, JWK } from "jose/jwk/from_key_like";
import { parseJwk } from "jose/jwk/parse";
import { SignJWT } from "jose/jwt/sign";
import {
  generateKeyPair,
  GenerateKeyPairResult,
} from "jose/util/generate_key_pair";
import { Sequelize } from "sequelize";
import winston from "winston";
import { checkin } from "./checkin";
import { expressReceiverSetup } from "./express-receiver";
import { Installation } from "./installation";

dotenv.config();

const url = process.env.TRAVELYNX_SLACK_URL;
const signingAlgorithm = process.env.JWT_SIGNING_ALGORITHM;
const keyDir = "./keys";
const privKeyPath = "./keys/priv.json";
const pubKeyPath = "./keys/pub.json";

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./db/app.db",
});

const InstallationModel = Installation(sequelize);

(async () => {
  let keyPair: GenerateKeyPairResult;
  if (fs.existsSync(pubKeyPath) && fs.existsSync(privKeyPath)) {
    const privateJwk = JSON.parse(
      fs.readFileSync(privKeyPath).toString()
    ) as JWK;
    const publicJwk = JSON.parse(fs.readFileSync(pubKeyPath).toString()) as JWK;

    keyPair = {
      privateKey: await parseJwk(privateJwk, signingAlgorithm),
      publicKey: await parseJwk(publicJwk, signingAlgorithm),
    };
  } else {
    keyPair = await generateKeyPair(signingAlgorithm);

    const privateJwk = await fromKeyLike(keyPair.privateKey);
    const publicJwk = await fromKeyLike(keyPair.publicKey);

    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir);
    }

    fs.writeFileSync(privKeyPath, JSON.stringify(privateJwk));
    fs.writeFileSync(pubKeyPath, JSON.stringify(publicJwk));
  }

  const receiver = expressReceiverSetup(InstallationModel);
  const slackApp = new App({ receiver });

  slackApp.message(async ({ say, context, message }) => {
    logger.info("Message received");
    const jwt = await new SignJWT({
      teamId: context.teamId,
      userId: (message as GenericMessageEvent).user,
      enterpriseId: context.enterpriseId,
    })
      .setProtectedHeader({ alg: signingAlgorithm })
      .setIssuedAt()
      .sign(keyPair.privateKey);
    await say(
      `Use this URL as the webhook endpoint:\n${url}/checkin/\nUse this as the Bearer Token:\n\`\`\`\n${jwt.toString()}\n\`\`\``
    );
  });

  receiver.router.use(express.json());

  checkin(receiver, slackApp, keyPair.publicKey);

  console.log(
    await receiver.installer.generateInstallUrl({
      scopes: ["im:history", "chat:write"],
      userScopes: ["users.profile:write"],
      redirectUri: `${url}/slack/oauth_redirect`,
    })
  );

  try {
    await sequelize.authenticate();
    logger.info("Database connected");
  } catch (err) {
    logger.error(`Unable to connect to database: ${err}`);
  }

  await slackApp.start(parseInt(process.env.PORT) || 3000);

  logger.info("Slack App started");
  logger.info("Listening for Travelynx Checkins");
})();
