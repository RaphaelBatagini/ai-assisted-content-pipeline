"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, RefreshCw } from "lucide-react";

export default function PaymentPendingPage() {
  const { user, logout } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  // Poll subscription status every 5s
  useQuery({
    queryKey: ["subscriptionStatus"],
    queryFn: async () => {
      const resp = await api.post("/api/auth/refresh");
      return resp.data.accessToken;
    },
    refetchInterval: 5000,
    enabled: user?.subscriptionStatus === "pending",
  });

  async function handlePayment() {
    setRedirecting(true);
    try {
      const resp = await api.post("/api/payment/checkout");
      window.location.href = resp.data.url;
    } catch {
      toast.error("Failed to start checkout. Please try again.");
      setRedirecting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-yellow-600" />
          </div>
          <CardTitle>Subscription Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            Your account is pending activation. Complete your subscription to access the backoffice.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Checking activation status…
          </div>
          <Button className="w-full" onClick={handlePayment} disabled={redirecting}>
            {redirecting ? "Redirecting…" : "Complete subscription"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={logout}>
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
