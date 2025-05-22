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
      // do nothing
    };

    this.transport.onerror = (error: Error) => {
      this.onError(error);
    };

    this.transport.onmessage = (message, extra) => {
      this.endpoint?.send({
        type: "message",
        data: message,
        extra
      });
    };
    this.endpoint!.onmessage = (message) => {
      if (message.type === "message") {
        this.transport.send(message.data);
      } else if (message.type === "close") {
        this.transport.close();
      } else if (message.type === "error") {
        this.onError(new Error(message.data as any));
      }
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
}
