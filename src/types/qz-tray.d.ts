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

  type CertificatePromiseCallback = (resolve: (cert: string) => void, reject: (error: Error) => void) => void;
  type SignaturePromiseCallback = (toSign: string) => (resolve: (signature: string) => void, reject: (error: Error) => void) => void;

  const qz: {
    websocket: {
      connect: (options?: { host?: string; usingSecure?: boolean }) => Promise<void>;
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
    security: {
      setCertificatePromise: (callback: CertificatePromiseCallback) => void;
      setSignaturePromise: (callback: SignaturePromiseCallback) => void;
      setSignatureAlgorithm: (algorithm: 'SHA1' | 'SHA256' | 'SHA512') => void;
    };
  };
  export default qz;
}
