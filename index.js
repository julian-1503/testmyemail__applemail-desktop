import dotenv from "dotenv";
import path from "path";
import os from "os";

import { processTest } from "./ProcessTest.js";
import App, { states } from "./App.js";

dotenv.config();

const filePath = path.join(
  os.homedir(),
  "documents",
  "eml",
  "2022-02-15_75592_091020_web.eml"
);

const app = new App();

app.on("state-transition", (oldState, newState) => {
  console.log(`Transitioning from state: ${oldState} to: ${newState}`);
  switch (newState) {
    case states.notProvisioned:
      app.provision();
      break;
    case states.provisioned:
    case states.notConnectedToSource:
      app.connectToSource();
      break;
    case state.connectedToSource:
    case state.idling:
      app.processNextTest();
      break;
  }
});

await app.provision();

//const buffer = await processTest(filePath);

//console.log(">>>>>>>>>>>> buffer <<<<<<<<<<", buffer);k
