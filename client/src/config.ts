// src/api/axiosInstance.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Создаем кастомный экземпляр Axios
const api: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(config)
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Обертка для всех запросов с автоматической обработкой ошибок
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
