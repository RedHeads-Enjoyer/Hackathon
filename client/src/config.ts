// src/api/axiosInstance.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import {authAPI} from "./modules/auth/authAPI.ts";

// Создаем кастомный экземпляр Axios
const api: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// axiosInstance.ts
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const response = await authAPI.refresh();
                localStorage.setItem('access_token', response.access_token);
                api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const request = async <T = any>(
    config: AxiosRequestConfig
): Promise<T> => {
    try {
        const response: AxiosResponse<T> = await api(config);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;
        // Обработка различных типов ошибок
        if (axiosError.response) {
            // Ошибка от сервера (4xx, 5xx)
            // @ts-ignore
            throw new Error(axiosError.response.data?.error || 'Server error');
        } else if (axiosError.request) {
            // Запрос был сделан, но ответ не получен
            throw new Error('No response from server');
        } else {
            // Ошибка при настройке запроса
            throw new Error('Request setup error');
        }
    }
};
