import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  
});

// export interface ApiError extends Error {
//   status?: number;
//   fieldErrors?: Record<string, string>;
//   originalError?: any;
// }
apiClient.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      const method = config.method?.toUpperCase() || "GET";
      const url = config.url || "";
      console.log(`API Request:  ${url} ${method}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      const originalRequestUrl = error.config?.url || "";

      // 401 Unauthorized: Session expired or invalid
      if (status === 401) {
        // Avoid infinite redirect loops if login or csrf checks return 401
        const isAuthCheck =
          originalRequestUrl.includes("/api/auth/login") ||
          originalRequestUrl.includes("/sanctum/csrf-cookie");

        if (typeof window !== "undefined" && !isAuthCheck) {
          // Notify AuthContext to clear local user state
          window.dispatchEvent(new CustomEvent("auth:unauthorized"));
          if (window.location.pathname !== "/login") {
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/login";
          }
        }
      }

      // 403 Forbidden: User lacks required role or permission
      if (status === 403) {
        const forbiddenMessage =
          (error.response.data as { message?: string })?.message ||
          "You do not have permission to perform this action.";

        if (typeof window !== "undefined") {
          // Notify UI to display error banner/toast WITHOUT logging the user out
          window.dispatchEvent(
            new CustomEvent("auth:forbidden", {
              detail: { message: forbiddenMessage },
            })
          );
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
