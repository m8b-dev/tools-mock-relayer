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
const relayerUrl = process.env.RELAYER_URL || "http://relayer.un1.io/antica/v1";

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
<script>

    const isUPExtension =  (!!window.ethereum && !!window.lukso);
    const addUpFunc = function () {
    if (!isUPExtension) {
    console.log("not a UP extension");
    return;
    }

    try {
    const request = {
    method: 'up_addTransactionRelayer', // https://docs.lukso.tech/standards/rpc-api#up_addtransactionrelayer
    params: [
{
    name: "UN1.IO",
    apiUrl: "${relayerUrl}",
    chainIds: [${CHAIN_ID}],
},
    ],
}
    window.lukso.request(request).then(function () {
        alert('Relayer Added');
}).catch(function (err) {
    if (4001 === err.code) {
        alert('Hey, you already have the relayer! Go to settings of your up extension. ')
    }
    
    console.log("did not import the profile", err);
    
    return;
})
} catch (error) {
    console.log("Could not connect web3", error);
    
    return;
}
}


window.onload = function(event) {
    if (window.ethereum) {
        const placeHolder = document.getElementById("relayButtonPlaceholder");
        console.log(placeHolder);
        const button = document.createElement("BUTTON");
        button.id = "buttonAddRelayer";
        button.onclick = function (event) { addUpFunc() };
        button.innerHTML = "Add UN1.IO relayer";
        placeHolder.appendChild(button);
}}
</script>
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
| IMPORTANT! YOU MUST HAVE YOUR UP EXTENSION UNLOCKED TO ADD A RELAYER </br>
<div id="relayButtonPlaceholder"></div></br>
==========================================================================</br>
=============X======X===X===X====XX=====================================</br>
=============X======X===XX==X===X=X=====================================</br>
=============X======X===X=X=X=====X=====================================</br>
=============X======X===X==XX=====X=====================================</br>
==============XXXXX====X===X===X=X=X===================================</br>
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
