"use client";

import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, Unplug, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useGoogleProvisioningStatus } from "@/hooks/useGoogleProvisioningStatus";
import { initiateGoogleConnect, disconnectGoogle, retryGoogleProvisioning } from "@/lib/api";

const PROVISIONING_MESSAGES: Record<string, string> = {
  pending: "Connecting to Google…",
  provisioning: "Setting up GA4 property and GTM container…",
};

export function GoogleConnectCard() {
  const { siteId } = useParams<{ siteId: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGoogleProvisioningStatus(siteId);

  async function handleConnect() {
    try {
      const url = await initiateGoogleConnect(siteId);
      window.location.href = url;
    } catch {
      toast.error("Failed to start Google connection.");
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectGoogle(siteId);
      queryClient.invalidateQueries({ queryKey: ["google-connection-status", siteId] });
      toast.success("Google account disconnected.");
    } catch {
      toast.error("Failed to disconnect Google account.");
    }
  }

  async function handleRetry() {
    try {
      await retryGoogleProvisioning(siteId);
      queryClient.invalidateQueries({ queryKey: ["google-connection-status", siteId] });
      toast.info("Retrying provisioning…");
    } catch {
      toast.error("Failed to retry provisioning.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  const status = data?.provisioningStatus ?? "idle";

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!data?.connected || status === "idle") {
    return (
      <div className="rounded-lg border bg-muted/30 px-4 py-5 space-y-3">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 mt-0.5 shrink-0 text-primary" />
          <div>
            <p className="font-medium text-sm">Connect Google</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automatically provision a GA4 property and GTM container — no manual setup required.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleConnect}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect with Google
        </Button>
      </div>
    );
  }

  // ── Pending / provisioning ───────────────────────────────────────────────────
  if (status === "pending" || status === "provisioning") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span>{PROVISIONING_MESSAGES[status] ?? "Provisioning…"}</span>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-2 text-sm text-red-800">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Provisioning failed</p>
            {data.provisioningError && (
              <p className="text-xs mt-0.5 text-red-700">{data.provisioningError}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" variant="outline" onClick={handleRetry}>
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Retry
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" size="sm" variant="ghost" className="text-red-700 hover:text-red-800">
                <Unplug className="w-3 h-3 mr-1.5" />
                Disconnect
              </Button>
            }
            title="Disconnect Google?"
            description="This will remove the Google connection and reset all provisioned analytics data for this site."
            confirmLabel="Disconnect"
            destructive
            onConfirm={handleDisconnect}
          />
        </div>
      </div>
    );
  }

  // ── Ready ────────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-medium">Google connected</span>
          {data.googleEmail && (
            <span className="text-xs text-green-700">({data.googleEmail})</span>
          )}
        </div>
        <ConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive h-7 px-2 text-xs">
              <Unplug className="w-3 h-3 mr-1" />
              Disconnect
            </Button>
          }
          title="Disconnect Google?"
          description="This will remove the Google connection and reset all provisioned analytics data for this site."
          confirmLabel="Disconnect"
          destructive
          onConfirm={handleDisconnect}
        />
      </div>

      <dl className="grid grid-cols-1 gap-1 text-xs text-green-700">
        {data.gaTrackingId && (
          <div className="flex gap-2">
            <dt className="font-medium w-36 shrink-0">GA4 Measurement ID</dt>
            <dd className="font-mono">{data.gaTrackingId}</dd>
          </div>
        )}
        {data.gaPropertyId && (
          <div className="flex gap-2">
            <dt className="font-medium w-36 shrink-0">GA4 Property ID</dt>
            <dd className="font-mono">{data.gaPropertyId}</dd>
          </div>
        )}
        {data.gtmContainerId && (
          <div className="flex gap-2">
            <dt className="font-medium w-36 shrink-0">GTM Container ID</dt>
            <dd className="font-mono">{data.gtmContainerId}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
