import {authAPI} from "./modules/auth/authAPI.ts";

export class ChatSocket {
    private socket: WebSocket | null = null;
    private chatId: number;
    private messageHandlers: ((message: any) => void)[] = [];
    private reconnectTimeout: number | null = null;
    private connectionState = false; // Добавим для явного отслеживания

    constructor(chatId: number) {
        this.chatId = chatId;
    }

    async connect() {
        try {
            await this.ensureFreshToken();
            const token = localStorage.getItem('access_token');
            if (!token) {
                console.error('Отсутствует токен доступа');
                return;
            }

            if (this.socket) {
                this.socket.close();
            }

            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/chat/${this.chatId}?token=${token}`;

            console.log("Подключение к WebSocket:", wsUrl);
            this.socket = new WebSocket(wsUrl);

            // Добавляем обработчики событий
            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.messageHandlers.forEach(handler => handler(message));
                } catch (e) {
                    console.error('Ошибка при обработке сообщения:', e);
                }
            };

            this.socket.onopen = () => {
                console.log(`Соединение с чатом ${this.chatId} установлено`);
                this.connectionState = true;
            };

            this.socket.onclose = (event) => {
                console.log(`Соединение с чатом ${this.chatId} закрыто`, event);
                this.connectionState = false;
            };

            this.socket.onerror = (error) => {
                console.error('Ошибка WebSocket:', error);
                this.connectionState = false;
            };
        } catch (error) {
            console.error('Ошибка при подключении WebSocket:', error);
        }
    }
    // Новый метод для обновления токена
    private async ensureFreshToken() {
        try {
            // Декодируем текущий токен для проверки срока действия
            const token = localStorage.getItem('access_token');
            if (!token) return;

            // Базовая проверка на истекший токен (можно использовать jwt-decode)
            // Простая проверка - был ли обновлен токен недавно
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                // Если токен истекает в ближайшие 5 минут, обновляем
                if (payload.exp && payload.exp * 1000 < Date.now() + 5 * 60 * 1000) {
                    console.log('Обновление токена для WebSocket...');
                    const result = await authAPI.refresh();
                    localStorage.setItem('access_token', result.access_token);
                }
            }
        } catch (error) {
            console.error('Ошибка при обновлении токена:', error);
            localStorage.removeItem('access_token');
            // Перенаправление на логин или другая обработка
        }
    }

    disconnect() {
        if (this.reconnectTimeout) {
            window.clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        this.connectionState = false;
        this.messageHandlers = [];
    }

    onMessage(handler: (message: any) => void) {
        this.messageHandlers.push(handler);
        // Возвращаем функцию отписки
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    sendMessage(content: string) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ content }));
            return true;
        } else {
            console.error('WebSocket не подключен', {
                readyState: this.socket?.readyState,
                connectionState: this.connectionState
            });
            return false;
        }
    }

    isConnected() {
        return this.connectionState && this.socket?.readyState === WebSocket.OPEN;
    }
}