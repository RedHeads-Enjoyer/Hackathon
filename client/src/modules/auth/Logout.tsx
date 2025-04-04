import React, { useEffect } from "react";
import { authAPI } from "./authAPI";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "./store/authSlice";
import { api } from "../../config.ts"; // Импортируем наш экземпляр axios

const Logout: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const performLogout = async () => {
            try {
                // 1. Отправляем запрос на сервер для выхода
                await authAPI.logout();
            } catch (error) {
                console.error("Logout API error:", error);
                // Даже если запрос не удался, продолжаем процесс выхода на клиенте
            } finally {
                // 2. Очищаем хранилище
                localStorage.removeItem('access_token');

                // 3. Сбрасываем состояние аутентификации
                dispatch(logout());

                // 4. Отменяем все pending запросы
                api.interceptors.request.eject(0);
                api.interceptors.response.eject(0);

                // 5. Перенаправляем на страницу входа
                navigate('/login', { replace: true });

                // 6. Принудительно перезагружаем страницу для сброса состояния
                window.location.reload();
            }
        };

        performLogout();
    }, [dispatch, navigate]);

    return (
        <div className="logout-container">
            <p>Выход из системы...</p>
        </div>
    );
};

export default Logout;