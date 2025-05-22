import { IConnectorEndpoint } from "./endpoint.type";

export class ConnectorCenter<T extends IConnectorEndpoint>{
  protected clientMap = new Map<string, T>;

  getClient(clientId: string) {
    return this.clientMap.get(clientId);
  }
  setClient(clientId: string, client: T) {
    this.clientMap.set(clientId, client);
  }
}
