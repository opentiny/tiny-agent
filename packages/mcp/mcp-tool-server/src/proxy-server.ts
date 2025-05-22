import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { IConnectorEndpoint } from './connector';

export class ProxyServer {
  private endpoint?: IConnectorEndpoint;

  protected transport?: Transport;
  async connect(transport: Transport): Promise<void> {
    if (this.transport) {
      throw new Error("Already connected");
    }
    if (!this.endpoint) {
      throw new Error("No endpoint set");
    }
    this.transport = transport;
    this.transport.onclose = () => {
      this.close();
    };

    this.transport.onerror = (error: Error) => {
      this.onError(error);
    };

    this.transport.onmessage = (message, extra) => {
      this.endpoint.send({
        type: "message",
        data: message,
        extra
      });
    };

    this.endpoint.onmessage = (message) => {
      this.transport!.send(message.data);
    };

    await this.transport.start();
  }
  async setEndPoint(endpoint: IConnectorEndpoint): Promise<void> {
    this.endpoint = endpoint;
  }
  private onError(error: Error) {
    console.error("Error in transport", error);
  }
  private close() {
    this.endpoint.onmessage = null;
    this.transport = null
  }
}
