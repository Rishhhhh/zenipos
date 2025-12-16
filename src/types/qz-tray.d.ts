declare module 'qz-tray' {
  interface PrintData {
    type?: 'raw' | 'pixel' | 'html';
    format?: 'command' | 'plain' | 'image' | 'pdf' | 'html';
    flavor?: 'hex' | 'base64' | 'file' | 'plain';
    data: string | number[] | ArrayBuffer;
    options?: Record<string, unknown>;
  }

  interface PrinterConfig {
    // Config object returned by configs.create
  }

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
      create: (printer: string, options?: Record<string, unknown>) => PrinterConfig;
    };
    print: (config: PrinterConfig, data: (PrintData | string)[]) => Promise<void>;
  };
  export default qz;
}
