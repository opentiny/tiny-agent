declare module '@opentiny/tiny-agent-task-action-lib' {
  export * from './dom-actions';
  export * from './form-actions';
  export * from './user-guide-actions';
  export * from './vue-router-actions';
}

declare module '*.svg?raw' {
  const content: string;
  export default content;
}
