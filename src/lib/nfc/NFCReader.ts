import { toast } from "sonner";

export interface NFCCardData {
  table_id: string;
  branch_id: string;
  encoded_at: Date;
  security_hash: string;
}

export interface NFCCard {
  serialNumber: string;
  data: NFCCardData;
}

export class NFCReader {
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'NDEFReader' in window;
  }

  /**
   * Check if Web NFC API is supported
   */
  isNFCSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Request NFC permissions
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      toast.error("NFC is not supported on this device");
      return false;
    }

    try {
      // Web NFC doesn't require explicit permission request
      // Permission is requested when scan() is called
      return true;
    } catch (error) {
      console.error("NFC permission error:", error);
      toast.error("Failed to request NFC permissions");
      return false;
    }
  }

  /**
   * Scan an NFC card
   */
  async scanCard(): Promise<NFCCard> {
    if (!this.isSupported) {
      throw new Error("NFC is not supported on this device");
    }

    try {
      const ndef = new (window as any).NDEFReader();
      
      // Start scanning
      await ndef.scan();
      toast.success("Waiting for NFC card...");

      // Wait for a card to be detected
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          ndef.stop?.();
          reject(new Error("Scan timeout"));
        }, 30000); // 30 second timeout

        ndef.addEventListener("reading", ({ message, serialNumber }: any) => {
          clearTimeout(timeout);
          ndef.stop?.();

          try {
            // Parse NDEF message
            const record = message.records[0];
            const textDecoder = new TextDecoder();
            const jsonData = textDecoder.decode(record.data);
            const data: NFCCardData = JSON.parse(jsonData);

            resolve({
              serialNumber,
              data
            });
          } catch (error) {
            reject(new Error("Failed to parse NFC card data"));
          }
        });

        ndef.addEventListener("readingerror", () => {
          clearTimeout(timeout);
          ndef.stop?.();
          reject(new Error("Failed to read NFC card"));
        });
      });
    } catch (error: any) {
      console.error("NFC scan error:", error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error("NFC permission denied. Please allow NFC access.");
      } else if (error.name === 'NotSupportedError') {
        throw new Error("NFC is not supported on this device");
      }
      
      throw error;
    }
  }

  /**
   * Write data to an NFC card
   */
  async writeCard(tableId: string, branchId: string): Promise<string> {
    if (!this.isSupported) {
      throw new Error("NFC is not supported on this device");
    }

    try {
      const ndef = new (window as any).NDEFReader();

      // Generate security hash
      const securityHash = await this.generateSecurityHash(tableId, branchId);

      // Prepare card data
      const cardData: NFCCardData = {
        table_id: tableId,
        branch_id: branchId,
        encoded_at: new Date(),
        security_hash: securityHash
      };

      // Write NDEF message
      await ndef.write({
        records: [
          {
            recordType: "text",
            data: JSON.stringify(cardData)
          }
        ]
      });

      toast.success("NFC card encoded successfully");
      return securityHash;
    } catch (error: any) {
      console.error("NFC write error:", error);
      
      if (error.name === 'NotAllowedError') {
        throw new Error("NFC permission denied");
      } else if (error.name === 'NotSupportedError') {
        throw new Error("NFC is not supported on this device");
      }
      
      throw error;
    }
  }

  /**
   * Verify card data integrity
   */
  async verifyCard(data: NFCCardData): Promise<boolean> {
    try {
      const expectedHash = await this.generateSecurityHash(
        data.table_id,
        data.branch_id
      );
      return data.security_hash === expectedHash;
    } catch (error) {
      console.error("Card verification error:", error);
      return false;
    }
  }

  /**
   * Generate security hash for card verification
   */
  private async generateSecurityHash(tableId: string, branchId: string): Promise<string> {
    const data = `${tableId}:${branchId}:zenipos`;
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Stop any ongoing NFC operations
   */
  async stop(): Promise<void> {
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.stop?.();
    } catch (error) {
      console.error("Error stopping NFC:", error);
    }
  }
}

// Singleton instance
export const nfcReader = new NFCReader();
