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