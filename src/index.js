import dotenv from "dotenv";

import App, { states } from "./App.js";
import logger from "./Logger.js";

import { activateMailApp } from "./Screenshot.js";

import { updateResolutionIfAvailable } from "./utils.js";

dotenv.config();

const app = new App();

updateResolutionIfAvailable();

app.on("state-transition", (oldState, newState) => {
  logger.info(`Transitioning from state: ${oldState} to: ${newState}`);

  switch (newState) {
    case states.notProvisioned:
      app.provision();
      break;
    case states.provisioned:
    case states.notConnectedToSource:
      app.connectToSource();
      break;
    case states.connectedToSource:
    case states.idling:
      app.processNextTest();
      break;
  }
});

await activateMailApp();

app.provision();
