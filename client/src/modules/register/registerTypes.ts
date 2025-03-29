export type RegisterData = {
    email: string,
    username: string,
    password: string
}

export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        username: string;
    };
}