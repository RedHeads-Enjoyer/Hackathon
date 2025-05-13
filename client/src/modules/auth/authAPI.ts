import {request} from "../../config.ts";
import {AuthResponse, LoginFormData, RegisterData, User} from "./authTypes.ts";

export const authAPI = {
    login: async (data: LoginFormData) =>
        request<AuthResponse>({ method: 'POST', url: '/auth/login', data}),
    logout: async () =>
        request({ method: 'POST', url: '/auth/logout'}),
    register: async (data: RegisterData) =>
        request<AuthResponse>({ method: 'POST', url: '/auth/register', data }),
    refresh: async () =>
        request<AuthResponse>({ method: 'POST', url: '/auth/refresh' }),
    verify: async () =>
        request<User>({ method: 'GET', url: '/auth/verify' }),
};