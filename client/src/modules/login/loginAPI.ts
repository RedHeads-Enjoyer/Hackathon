import {request} from "../../config.ts";
import {AuthResponse, LoginFormData} from "./loginTypes.ts";

export const loginAPI = {
    login: async (data: LoginFormData) =>
        request<AuthResponse>({ method: 'POST', url: '/auth/login', data}),
};