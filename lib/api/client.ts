"use client";

import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    __retried?: boolean;
  }
}

export const api = axios.create({
  baseURL: "/api/proxy",
  withCredentials: true,
  headers: { "X-Requested-With": "fetch" },
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as InternalAxiosRequestConfig | undefined;
    if (error.response?.status === 401 && cfg && !cfg.__retried) {
      cfg.__retried = true;
      const refreshed = await fetch("/api/auth/refresh", { method: "POST" });
      if (refreshed.ok) return api(cfg);
      if (typeof window !== "undefined") window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
