import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authAPI } from "./modules/auth/authAPI.ts";

// Основной API клиент с базовым URL /api
export const api: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем новый экземпляр для работы с файлами - без префикса /api
export const fileApi: AxiosInstance = axios.create({
    baseURL: '/api', // Корневой URL без /api
    timeout: 30000, // Увеличиваем тайм-аут для загрузки файлов
});

let refreshTokenRequest: Promise<{ access_token: string }> | null = null;
let isRefreshingFailed = false;

// Общая функция настройки интерцепторов для обоих экземпляров axios
const setupInterceptors = (axiosInstance: AxiosInstance) => {
    // Интерцептор запросов
    axiosInstance.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('access_token');

            if (config.url?.includes('/auth/login')) {
                return config;
            }

            if (token && !isRefreshingFailed) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            if (config.data instanceof FormData) {
                delete config.headers['Content-Type'];
            }

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Интерцептор ответов
    axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

            if (originalRequest.url?.includes('/auth/login')) {
                return Promise.reject(error);
            }

            // Обработка 401 ошибки
            if (error.response?.status === 401 && !originalRequest._retry) {
                console.log('Original request:', originalRequest);
                if (isRefreshingFailed) {
                    return Promise.reject(error);
                }

                originalRequest._retry = true;

                try {
                    // Запрос на обновление токена
                    if (!refreshTokenRequest) {
                        refreshTokenRequest = authAPI.refresh().finally(() => {
                            refreshTokenRequest = null;
                        });
                    }

                    const data = await refreshTokenRequest;
                    localStorage.setItem('access_token', data.access_token);

                    // Обновляем оригинальный запрос
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
                    }

                    return axiosInstance(originalRequest);
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
};

// Применяем интерцепторы к обоим экземплярам
setupInterceptors(api);
setupInterceptors(fileApi);

// Функция для выполнения запросов к API
export const request = async <T = any>(config: AxiosRequestConfig): Promise<T> => {
    try {
        const response: AxiosResponse<T> = await api(config);
        return response.data;
    } catch (error) {
        const axiosError = error as AxiosError;

        // Обработка ошибок
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

// Новая функция для работы с файлами
export const requestFile = async (fileId: number): Promise<Blob> => {
    try {
        console.log(`Запрос файла с ID: ${fileId}`);

        const response = await fileApi.get(`/file/${fileId}`, {
            responseType: 'blob',
            headers: {
                'Accept': 'image/*'
            }
        });

        console.log(`Файл с ID ${fileId} успешно получен, тип: ${response.headers['content-type']}`);
        return response.data;
    } catch (error) {
        console.error(`Ошибка при получении файла с ID ${fileId}:`, error);
        const axiosError = error as AxiosError;

        if (axiosError.response) {
            console.error(`Статус ответа: ${axiosError.response.status}`);
            throw new Error(`Ошибка загрузки файла: ${axiosError.response.status}`);
        } else if (axiosError.request) {
            throw new Error('Сервер не ответил на запрос');
        } else {
            throw new Error('Ошибка настройки запроса');
        }
    }
};