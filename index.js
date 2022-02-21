import dotenv from "dotenv";

import App, { states } from "./App.js";
import logger from "./Logger.js";

import { runAppleScript } from "run-applescript";

dotenv.config();

const app = new App();

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

await runAppleScript(`
  tell application "Mail"
     if not running then
        run
        delay 0.25
     end if
     activate
  end tell

  tell application "System Events"
     tell application process "Mail"
        set frontmost to true
     end tell
  end tell
`);

app.provision();
