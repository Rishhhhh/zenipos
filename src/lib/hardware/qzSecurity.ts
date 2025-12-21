import qz from "qz-tray";
import { supabase } from "@/integrations/supabase/client";

let initialized = false;

/**
 * Initialize QZ Tray security with certificate and signature promises.
 * This enables silent printing without "Allow" popups after first approval.
 */
export async function initQzSecurity(): Promise<void> {
  if (initialized) return;

  // 1) Certificate Promise - fetches public certificate
  qz.security.setCertificatePromise((resolve, reject) => {
    fetch("/qz/digital-certificate.txt", {
      cache: "no-store",
      headers: { "Content-Type": "text/plain" },
    })
      .then((res) => {
        if (!res.ok) {
          return Promise.reject(new Error(`Failed to fetch certificate: ${res.status}`));
        }
        return res.text();
      })
      .then((txt) => {
        if (!txt.includes("BEGIN CERTIFICATE")) {
          reject(new Error("Invalid certificate content (missing BEGIN CERTIFICATE)"));
          return;
        }
        console.log("[QZ Security] Certificate loaded successfully");
        resolve(txt);
      })
      .catch((err) => {
        console.error("[QZ Security] Certificate fetch failed:", err);
        reject(err);
      });
  });

  // 2) Set signature algorithm to SHA-512 (matches edge function)
  qz.security.setSignatureAlgorithm("SHA512");

  // 3) Signature Promise - calls edge function to sign challenges
  qz.security.setSignaturePromise((toSign: string) => {
    return (resolve, reject) => {
      console.log("[QZ Security] Signing challenge, length:", toSign.length);
      
      supabase.functions.invoke("qz-sign", {
        body: { toSign },
      })
        .then(({ data, error }) => {
          if (error) {
            console.error("[QZ Security] Signing error:", error);
            reject(error);
            return;
          }
          
          if (!data?.signature) {
            reject(new Error("Signing server returned no signature"));
            return;
          }
          
          console.log("[QZ Security] Challenge signed successfully");
          resolve(data.signature as string);
        })
        .catch((err) => {
          console.error("[QZ Security] Signing request failed:", err);
          reject(err);
        });
    };
  });

  initialized = true;
  console.log("[QZ Security] Security initialized with certificate + signature");
}

/**
 * Reset initialization state (useful for testing/debugging)
 */
export function resetQzSecurity(): void {
  initialized = false;
}

/**
 * Check if QZ security has been initialized
 */
export function isQzSecurityInitialized(): boolean {
  return initialized;
}
