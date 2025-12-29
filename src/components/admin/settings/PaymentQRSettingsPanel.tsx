import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, Trash2, QrCode, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { uploadPaymentQRCode, deletePaymentQRCode, QRProviderType } from '@/lib/storage/paymentQrUpload';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QRUploadCardProps {
  providerType: QRProviderType;
  providerName: string;
  providerLogo: string;
  providerColor: string;
  currentUrl: string | null;
  organizationId: string;
  onUploadSuccess: (url: string, providerType: QRProviderType) => void;
  onDeleteSuccess: (providerType: QRProviderType) => void;
}

function QRUploadCard({
  providerType,
  providerName,
  providerLogo,
  providerColor,
  currentUrl,
  organizationId,
  onUploadSuccess,
  onDeleteSuccess,
}: QRUploadCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadPaymentQRCode(file, organizationId, providerType);
      onUploadSuccess(result.url, providerType);
      toast.success(`${providerName} QR code uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload QR code');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${providerName} QR code?`)) return;

    setIsDeleting(true);
    try {
      await deletePaymentQRCode(organizationId, providerType);
      onDeleteSuccess(providerType);
      toast.success(`${providerName} QR code deleted`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete QR code');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 ${providerColor}`} />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{providerLogo}</div>
          <div>
            <CardTitle className="text-lg">{providerName}</CardTitle>
            <CardDescription className="text-xs">
              Upload your merchant QR code
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentUrl ? (
          <div className="space-y-3">
            <div className="relative aspect-square max-w-[200px] mx-auto bg-white rounded-lg border-2 border-dashed border-muted p-2">
              <img
                src={currentUrl}
                alt={`${providerName} QR Code`}
                className="w-full h-full object-contain"
              />
              <div className="absolute -top-2 -right-2">
                <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Replace
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="aspect-square max-w-[200px] mx-auto border-2 border-dashed border-muted rounded-lg flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <QrCode className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Click to upload
              </p>
              <p className="text-xs text-muted-foreground/70">
                PNG, JPG up to 2MB
              </p>
            </div>
            {isUploading && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}

export function PaymentQRSettingsPanel() {
  const { organization } = useAuth();
  const { settings, updateSettings, isUpdating } = useOrganizationSettings();

  const handleUploadSuccess = async (url: string, providerType: QRProviderType) => {
    const updateData = providerType === 'duitnow'
      ? { duitnowQrUrl: url }
      : { tngQrUrl: url };
    updateSettings(updateData);
  };

  const handleDeleteSuccess = async (providerType: QRProviderType) => {
    const updateData = providerType === 'duitnow'
      ? { duitnowQrUrl: null }
      : { tngQrUrl: null };
    updateSettings(updateData);
  };

  if (!organization?.id) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Organization not found. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment QR Codes</CardTitle>
          <CardDescription>
            Upload your merchant QR codes for DuitNow and Touch 'n Go. These will be displayed on the customer screen during QR payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <QrCode className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> Take a clear photo of your merchant QR code poster from your bank or e-wallet provider. Make sure the QR code is clearly visible and not distorted.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-2">
            <QRUploadCard
              providerType="duitnow"
              providerName="DuitNow"
              providerLogo="🏦"
              providerColor="bg-[#E42227]"
              currentUrl={settings?.duitnow_qr_url || null}
              organizationId={organization.id}
              onUploadSuccess={handleUploadSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
            <QRUploadCard
              providerType="tng"
              providerName="Touch 'n Go"
              providerLogo="💳"
              providerColor="bg-[#0066CC]"
              currentUrl={settings?.tng_qr_url || null}
              organizationId={organization.id}
              onUploadSuccess={handleUploadSuccess}
              onDeleteSuccess={handleDeleteSuccess}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-sm">Upload QR Codes</p>
                <p className="text-xs text-muted-foreground">
                  Upload your merchant QR codes above
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-sm">Select QR at Checkout</p>
                <p className="text-xs text-muted-foreground">
                  Choose DuitNow or TNG in the payment modal
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-sm">Customer Scans</p>
                <p className="text-xs text-muted-foreground">
                  QR displays on customer screen for easy scanning
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
