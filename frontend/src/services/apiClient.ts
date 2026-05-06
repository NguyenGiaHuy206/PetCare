import axios, { AxiosError, AxiosInstance } from "axios";

import { tokenStorage } from "./tokenStorage";

const apiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError) => void;
}> = [];

const processQueue = (token: string | null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.onSuccess(token);
    } else {
      prom.onFailure(new AxiosError("Token refresh failed"));
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((onSuccess, onFailure) => {
          failedQueue.push({ onSuccess, onFailure });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(() => {
            tokenStorage.clearTokens();
            window.location.href = "/login";
            return Promise.reject(error);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${"http://localhost:8000"}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        tokenStorage.setTokens(access_token, refresh_token);

        apiClient.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(access_token);
        isRefreshing = false;

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(null);
        isRefreshing = false;
        tokenStorage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
