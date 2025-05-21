export interface IConnectorEndpoint {
  onmessage(message: any, extra?: any): void;
  send(message: any, extra?: any): void;
}