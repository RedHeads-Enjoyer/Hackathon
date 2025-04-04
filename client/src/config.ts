import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authAPI } from "./modules/auth/authAPI.ts";

export const api: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

let refreshTokenRequest: Promise<{ access_token: string }> | null = null;
let isRefreshingFailed = false;

// Интерцептор запросов
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');

        if (token && !isRefreshingFailed) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Интерцептор ответов
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Игнорируем определенные endpoints
        if (originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/refresh') ||
            originalRequest.url?.includes('/auth/verify')) {
            return Promise.reject(error);
        }

        // Обработка 401 ошибки
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshingFailed) {
                return Promise.reject(error);
            }

            originalRequest._retry = true;

            try {
                if (!refreshTokenRequest) {
                    refreshTokenRequest = authAPI.refresh().finally(() => {
                        refreshTokenRequest = null;
                    });
                }

                const { access_token } = await refreshTokenRequest;
                localStorage.setItem('access_token', access_token);

                // Обновляем оригинальный запрос
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                isRefreshingFailed = true;
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
    try {
        const response: AxiosResponse<T> = await api(config);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;

        if (axiosError.response) {
            const errorData = axiosError.response.data as any;
            throw new Error(errorData?.message || errorData?.error || 'Server error');
        } else if (axiosError.request) {
            throw new Error('No response from server');
        } else {
            throw new Error('Request setup error');
        }
    }
};