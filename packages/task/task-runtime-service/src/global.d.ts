declare global {
  interface Window {
    sendMessage: (task: any) => Promise<any>;
  }
}

declare module '*.svg?url' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}
