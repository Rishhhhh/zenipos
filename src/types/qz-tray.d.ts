declare module 'qz-tray' {
  const qz: {
    websocket: {
      connect: () => Promise<void>;
      disconnect: () => Promise<void>;
      isActive: () => boolean;
    };
    printers: {
      find: () => Promise<string | string[]>;
    };
    configs: {
      create: (printer: string) => any;
    };
    print: (config: any, data: any[]) => Promise<void>;
  };
  export default qz;
}
