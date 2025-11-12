import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { Loader2, Shield, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function SecuritySettingsPanel() {
  const { settings, sessions, updateSettings, revokeSession, isUpdating } = useOrganizationSettings();
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = (data: PasswordFormData) => {
    updateSettings({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    reset();
    setShowPasswordForm(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    if (confirm('Are you sure you want to revoke this session?')) {
      revokeSession(sessionId);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your organization login password. All active sessions will remain valid.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showPasswordForm ? (
            <Button onClick={() => setShowPasswordForm(true)}>
              <Shield className="mr-2 h-4 w-4" />
              Change Password
            </Button>
          ) : (
            <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...register('currentPassword')}
                  placeholder="Enter current password"
                />
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...register('newPassword')}
                  placeholder="Enter new password"
                />
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with 1 uppercase letter and 1 number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>
            Manage active organization login sessions. Revoke any session to force re-login.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions && sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {format(new Date(session.created_at), 'PPp')}
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.last_activity), 'PPp')}
                    </TableCell>
                    <TableCell>{session.ip_address || 'Unknown'}</TableCell>
                    <TableCell>
                      {new Date(session.expires_at) > new Date() ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Expired</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={new Date(session.expires_at) < new Date()}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No active sessions found
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Coming Soon</Badge>
            <p className="text-sm text-muted-foreground">
              Two-factor authentication will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
