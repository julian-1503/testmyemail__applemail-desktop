import EventEmitter from "events";
import { getProvisionSettings } from "./Provisioning.js";
import { createClient, commandOptions } from "redis";

export const states = {
  notProvisioned: "notProvisioned",
  provisioned: "provisioned",
  notConnectedToSource: "notConnectedToSource",
  connectedToSource: "connectedToSource",
  processing: "processing",
  idling: "idling",
};

export default class App extends EventEmitter {
  constructor() {
    super();
    this.state = states.notProvisioned;
    this.provisioningData = null;
    this.redisClient = null;
  }

  transitionState(newState) {
    if (states[newState]) {
      const oldState = this.state;

      this.state = newState;

      this.emit("state-transition", oldState, newState);
    }
  }

  async provision() {
    this.transitionState(states.provisioning);
    const data = await getProvisionSettings();

    this.provisioningData = data;

    console.log(">>>>>>", this.provisioningData);

    this.transitionState(states.provisioned);
  }

  async connectToSource() {
    const client = createClient({
      socket: {
        port: this.provisioningData.ss_config.redis_server.port,
        host: this.provisioningData.ss_config.redis_server.host,
      },
      database: this.provisioningData.ss_config.redis_server.database,
    });

    await client.connect();

    this.redisClient = client;
  }

  async getNextTest() {
    const next = await this.redisClient.blpop(
      commandOptions({ isIsolated: true }),
      this.settings.client_folder
    );

    return next;
  }
}
