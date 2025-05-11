export type RegisterData = {
    email: string,
    username: string,
    password: string
}

export type LoginFormData = {
    email: string,
    password: string,
}

export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        username: string;
    };
}

export interface User {
    id: number;
    username: string;
    systemRole: number;
}