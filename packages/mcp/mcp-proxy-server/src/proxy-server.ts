import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { IConnectorEndpoint } from '@opentiny/tiny-agent-mcp-connector';

export class ProxyServer {
  protected verifyCode?: string;
  protected endpoint?: IConnectorEndpoint;
 
  protected transport?: Transport | null;
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
      const newExtra = this.verifyCode 
        ? {
          ...(extra || {}),
          authInfo: {
            ...(extra?.authInfo || {}),
            extra: {
              ...(extra?.authInfo?.extra || {}),
              verifyCode: this.verifyCode
            }
          }
        }
        : extra;
      this.endpoint!.send({
        type: "message",
        data: message,
        extra: newExtra
      });
    };

    this.endpoint.onmessage = (message) => {
      this.transport!.send(message.data!);
    };

    await this.transport.start();
  }
  setEndPoint(endpoint: IConnectorEndpoint) {
    this.endpoint = endpoint;
  }

  setVerifyCode(code : string) {
    this.verifyCode = code;
  }

  protected onError(error: Error) {
    console.error("Error in transport", error);
  }
  protected close() {
    this.endpoint!.onmessage = null;
    this.transport = null;
  }
}
