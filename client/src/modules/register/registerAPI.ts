import {RegisterData, AuthResponse} from "./registerTypes.ts";
import {request} from "../../config.ts";

export const registerAPI = {
    register: async (data: RegisterData) =>
        request<AuthResponse>({ method: 'POST', url: '/auth/register', data }),
};