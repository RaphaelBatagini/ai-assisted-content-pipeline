import { useQuery } from "@tanstack/react-query";
import { getGoogleConnectionStatus, type GoogleConnectionStatus } from "@/lib/api";

const POLLING_INTERVAL_MS = 3000;

/**
 * Polls the Google connection + provisioning status for a site.
 * Polling is active only while status is 'pending' or 'provisioning'.
 * Automatically stops once provisioning reaches 'ready' or 'error'.
 */
export function useGoogleProvisioningStatus(siteId: string) {
  return useQuery<GoogleConnectionStatus>({
    queryKey: ["google-connection-status", siteId],
    queryFn: () => getGoogleConnectionStatus(siteId),
    refetchInterval: (query) => {
      const status = query.state.data?.provisioningStatus;
      return status === "pending" || status === "provisioning" ? POLLING_INTERVAL_MS : false;
    },
    retry: false,
  });
}
