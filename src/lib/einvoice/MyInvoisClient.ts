/**
 * LHDN MyInvois API Client
 * Malaysia e-Invoice compliance
 */

export interface MyInvoisConfig {
  environment: 'preprod' | 'production';
  clientId: string;
  clientSecret: string;
  supplierTin: string;
}

export interface InvoiceDocument {
  invoiceNumber: string;
  issueDate: string;
  supplierTin: string;
  supplierName: string;
  supplierAddress: string;
  buyerTin?: string;
  buyerName?: string;
  buyerAddress?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export interface SubmitResponse {
  success: boolean;
  uuid?: string;
  longId?: string;
  status?: string;
  error?: string;
  validationErrors?: string[];
}

export class MyInvoisClient {
  private config: MyInvoisConfig;
  private baseUrl: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: MyInvoisConfig) {
    this.config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.myinvois.hasil.gov.my'
      : 'https://preprod-api.myinvois.hasil.gov.my';
  }

  private async getAccessToken(): Promise<string> {
    // Check if token is still valid
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    // OAuth2 token request
    const response = await fetch(`${this.baseUrl}/connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'client_credentials',
        scope: 'InvoicingAPI',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 min buffer

    return this.token;
  }

  async submitDocument(document: InvoiceDocument): Promise<SubmitResponse> {
    const token = await this.getAccessToken();

    // Build LHDN-compliant payload
    const payload = this.buildLHDNPayload(document);

    const response = await fetch(`${this.baseUrl}/api/v1.0/documents/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ documents: [payload] }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || response.statusText,
        validationErrors: error.validationErrors,
      };
    }

    const result = await response.json();
    const doc = result.documents?.[0];

    return {
      success: doc?.status === 'Valid',
      uuid: doc?.uuid,
      longId: doc?.longId,
      status: doc?.status,
      validationErrors: doc?.validationErrors,
    };
  }

  async getDocumentDetails(uuid: string): Promise<any> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/api/v1.0/documents/${uuid}/details`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Get document failed: ${response.statusText}`);
    }

    return response.json();
  }

  buildQRUrl(uuid: string, longId: string): string {
    return `${this.baseUrl.replace('api.', '')}/${uuid}/share/${longId}`;
  }

  private buildLHDNPayload(doc: InvoiceDocument): any {
    return {
      _D: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      _A: "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      _B: "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      Invoice: [
        {
          ID: [{ _: doc.invoiceNumber }],
          IssueDate: [{ _: doc.issueDate }],
          IssueTime: [{ _: new Date().toISOString().split('T')[1].slice(0, 8) }],
          InvoiceTypeCode: [{ 
            _: "01",
            listVersionID: "1.0"
          }],
          DocumentCurrencyCode: [{ _: doc.currency || "MYR" }],
          AccountingSupplierParty: [
            {
              Party: [
                {
                  IndustryClassificationCode: [{ _: "46510", name: "Wholesale of computers, computer peripheral equipment and software" }],
                  PartyIdentification: [
                    {
                      ID: [{ _: doc.supplierTin, schemeID: "TIN" }]
                    }
                  ],
                  PartyLegalEntity: [
                    {
                      RegistrationName: [{ _: doc.supplierName }]
                    }
                  ],
                  PostalAddress: [
                    {
                      AddressLine: [{ Line: [{ _: doc.supplierAddress }] }],
                      CountrySubentityCode: [{ _: "14" }],
                      Country: [{ IdentificationCode: [{ _: "MYS", listID: "ISO3166-1", listAgencyID: "6" }] }]
                    }
                  ]
                }
              ]
            }
          ],
          AccountingCustomerParty: doc.buyerTin ? [
            {
              Party: [
                {
                  PartyIdentification: [
                    {
                      ID: [{ _: doc.buyerTin, schemeID: "TIN" }]
                    }
                  ],
                  PartyLegalEntity: [
                    {
                      RegistrationName: [{ _: doc.buyerName || "CASH CUSTOMER" }]
                    }
                  ],
                  PostalAddress: [
                    {
                      AddressLine: [{ Line: [{ _: doc.buyerAddress || "-" }] }],
                      Country: [{ IdentificationCode: [{ _: "MYS" }] }]
                    }
                  ]
                }
              ]
            }
          ] : [],
          LegalMonetaryTotal: [
            {
              LineExtensionAmount: [{ _: doc.subtotal.toFixed(2), currencyID: "MYR" }],
              TaxExclusiveAmount: [{ _: doc.subtotal.toFixed(2), currencyID: "MYR" }],
              TaxInclusiveAmount: [{ _: doc.totalAmount.toFixed(2), currencyID: "MYR" }],
              PayableAmount: [{ _: doc.totalAmount.toFixed(2), currencyID: "MYR" }]
            }
          ],
          InvoiceLine: doc.items.map((item, index) => ({
            ID: [{ _: String(index + 1) }],
            InvoicedQuantity: [{ _: String(item.quantity), unitCode: "C62" }],
            LineExtensionAmount: [{ _: item.subtotal.toFixed(2), currencyID: "MYR" }],
            Item: [
              {
                Description: [{ _: item.description }],
                ClassifiedTaxCategory: [
                  {
                    ID: [{ _: "01" }],
                    Percent: [{ _: (item.taxRate * 100).toFixed(2) }],
                    TaxScheme: [{ ID: [{ _: "OTH", schemeID: "UN/ECE 5153", schemeAgencyID: "6" }] }]
                  }
                ]
              }
            ],
            Price: [
              {
                PriceAmount: [{ _: item.unitPrice.toFixed(2), currencyID: "MYR" }]
              }
            ],
            ItemPriceExtension: [
              {
                Amount: [{ _: item.subtotal.toFixed(2), currencyID: "MYR" }]
              }
            ]
          })),
          TaxTotal: [
            {
              TaxAmount: [{ _: doc.taxAmount.toFixed(2), currencyID: "MYR" }],
              TaxSubtotal: [
                {
                  TaxableAmount: [{ _: doc.subtotal.toFixed(2), currencyID: "MYR" }],
                  TaxAmount: [{ _: doc.taxAmount.toFixed(2), currencyID: "MYR" }],
                  TaxCategory: [
                    {
                      ID: [{ _: "01" }],
                      TaxScheme: [{ ID: [{ _: "OTH" }] }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }
}
