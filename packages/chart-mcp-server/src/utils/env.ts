import process from "node:process";

/**
 * Get the VIS_REQUEST_SERVER from environment variables.
 */
export function getVisRequestServer() {
  return (
    process.env.VIS_REQUEST_SERVER ||
    "https://antv-studio.alipay.com/api/gpt-vis"
  );
}

/**
 * Get the `SERVICE_ID` from environment variables.
 */
export function getServiceIdentifier() {
  return process.env.SERVICE_ID;
}
