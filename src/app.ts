import { createServer } from "./config/express";
import {
  CHAIN_ID,
  OPERATOR_UP_ADDRESS,
  QUOTA_CONTRACT_ADDRESS,
} from "./globals";
import { logger } from "./libs/logger.service";
import { getSigner } from "./libs/signer.service";
import quotaController from "./modules/quota/quota.controller";
import { QuotaMode } from "./modules/quota/quota.service";
import relayerController from "./modules/relayer/relayer.controller";
import http from "http";
import { AddressInfo } from "net";

const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || "3000";
const relayerUrl = "http://relayer.un1.io/antica/v1";

async function startServer() {
  const app = createServer();
  const controllerAddress = getSigner().address;

  app.use("/antica/v1/", relayerController);
  app.use("/antica/v1/quota", quotaController);

  const server = http.createServer(app).listen({ host, port }, () => {
    const addressInfo = server.address() as AddressInfo;
    app.use("/", (req, res) => {
      const message = `
<html lang="EN">
<head>
<title>UN1.IO RELAYER ANTICA</title>
</head>
<body>
<div>
Welcome to Antica UN1.IO Relayer.</br>
It operates at LUKSO MAINNET.</br>
=========================================================================</br>
| If you came here by a browser it means that you are lost.</br>             
| Let me help you. This relayer server operates at following parameters:</br>
=========================================================================</br>
| Controller: ${controllerAddress} [EOA]</br>
| Operator: ${OPERATOR_UP_ADDRESS} [UP]</br>
| QuotaMode: ${QuotaMode.TokenQuotaTransactionsCount} [RELAYER]</br>
| Magic: 0xffffffff [BROWSER EXTENSION]</br>
| Relayer: ${relayerUrl}</br>
| Quota Token Address: ${QUOTA_CONTRACT_ADDRESS}</br>
| Chain ID: ${CHAIN_ID}</br>
=========================================================================</br>
| How to attach your BROWSER EXTENSION to this relayer: </br>
| Settings->Transaction Relay Services->Add Relayer </br>
==========================================================================</br>
| Name: UN1.ANTICA Antica </br>
| Website: https://un1.io </br>
| Api URL: ${relayerUrl} </br>
| Networks: LUKSO MAINNET - 42 </br>
| Profiles: Here pick your profile you wish to use </br>
============================================================================
</div>
</body>

</html>

`;
      res.send(message);
    });

    logger.info(
      `Server ready at http://${addressInfo.address}:${addressInfo.port}`
    );
  });

  const signalTraps: NodeJS.Signals[] = ["SIGTERM", "SIGINT", "SIGUSR2"];
  signalTraps.forEach((type) => {
    process.once(type, async () => {
      logger.info(`process.once ${type}`);

      server.close(() => {
        logger.debug("HTTP server closed");
      });
    });
  });
}

startServer();
