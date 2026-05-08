import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// In-memory access token store (shared in module scope for interceptor access)
let accessToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send httpOnly refresh cookie
});

// Request interceptor: inject Authorization header
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });
  failedQueue = [];
}

// Response interceptor: handle 401 by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isRefreshRequest = originalRequest.url?.includes("/api/auth/refresh");
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshRequest) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(Promise.reject.bind(Promise));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const resp = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken: string = resp.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAccessToken(null);
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Content Strategy Brief
export async function getContentStrategyBrief(siteId: string) {
  const response = await api.get(`/api/sites/${siteId}/content-strategy-brief`);
  return response.data;
}

export async function createContentStrategyBrief(siteId: string, data: Record<string, unknown>) {
  const response = await api.post(`/api/sites/${siteId}/content-strategy-brief`, data);
  return response.data;
}

export async function retryContentStrategyBrief(siteId: string) {
  const response = await api.post(`/api/sites/${siteId}/content-strategy-brief/retry`);
  return response.data;
}

// Google OAuth & Provisioning

export interface GoogleConnectionStatus {
  connected: boolean;
  googleEmail: string | null;
  provisioningStatus: 'idle' | 'pending' | 'provisioning' | 'ready' | 'error';
  provisioningError: string | null;
  gaTrackingId: string | null;
  gaPropertyId: string | null;
  gtmContainerId: string | null;
}

export async function getGoogleConnectionStatus(siteId: string): Promise<GoogleConnectionStatus> {
  const response = await api.get('/api/auth/google/status', { params: { siteId } });
  return response.data;
}

export async function initiateGoogleConnect(siteId: string): Promise<string> {
  const response = await api.get('/api/auth/google/connect', { params: { siteId } });
  return response.data.url as string;
}

export async function disconnectGoogle(siteId: string): Promise<void> {
  await api.delete('/api/auth/google/disconnect', { params: { siteId } });
}

export async function retryGoogleProvisioning(siteId: string): Promise<void> {
  await api.post('/api/auth/google/retry', null, { params: { siteId } });
}

// Analytics

export interface AnalyticsOverview {
  visitsTrend: { date: string; sessions: number }[];
  totals: {
    sessions: number;
    users: number;
    newUsers: number;
    avgSessionDurationSeconds: number | null;
    bounceRate: number | null;
    totalCtaClicks: number;
  };
  topPosts: {
    postId: string;
    title: string;
    slug: string;
    pageviews: number;
    ctaClicks: number;
    conversionRate: number;
  }[];
  topPostsByConversion: {
    postId: string;
    title: string;
    slug: string;
    pageviews: number;
    ctaClicks: number;
    conversionRate: number;
  }[];
  topCategories: { categoryId: string; name: string; pageviews: number }[];
  editorialVelocity: number;
  newVsReturning: { newUsers: number; returningUsers: number };
  gaConfigured: boolean;
}

export interface AnalyticsPostRow {
  postId: string;
  title: string;
  slug: string;
  pageviews: number;
  sessions: number;
  avgSessionDurationSeconds: number | null;
  bounceRate: number | null;
  ctaClicks: number;
  conversionRate: number;
}

export async function getAnalyticsOverview(
  siteId: string,
  params?: { startDate?: string; endDate?: string },
): Promise<AnalyticsOverview> {
  const response = await api.get(`/api/sites/${siteId}/analytics/overview`, { params });
  return response.data;
}

export async function getAnalyticsPosts(
  siteId: string,
  params?: { startDate?: string; endDate?: string; limit?: number; page?: number },
): Promise<{ rows: AnalyticsPostRow[]; page: number; limit: number }> {
  const response = await api.get(`/api/sites/${siteId}/analytics/posts`, { params });
  return response.data;
}

export async function getAnalyticsCategories(
  siteId: string,
  params?: { startDate?: string; endDate?: string; limit?: number; page?: number },
): Promise<{ rows: { categoryId: string; name: string; pageviews: number }[]; page: number; limit: number }> {
  const response = await api.get(`/api/sites/${siteId}/analytics/categories`, { params });
  return response.data;
}
