import { IConnectorEndpoint } from "./endpoint.type";
import { genId } from "./utils";

export class ConnectorCenter<T extends IConnectorEndpoint>{
  protected clientMap = new Map<string, T | ((id: string) => T)>();

  getClient(clientId: string, serverId?: string) {
    const client = this.clientMap.get(clientId);
    if (typeof client === 'function') {
      return client(serverId || genId());
    }
    return client;
  }

  setClient(clientId: string, client: T | ((id: string) => T)) {
    this.clientMap.set(clientId, client);
  }
  
  removeClient(clientId: string) {
    this.clientMap.delete(clientId);
  }
}
