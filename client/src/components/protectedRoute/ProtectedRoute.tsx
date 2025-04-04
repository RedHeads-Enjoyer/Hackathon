import {useSelector} from "react-redux";
import {RootState} from "../../store/store.ts";
import {Outlet, useNavigate} from "react-router-dom";
import {useEffect} from "react";
import {authAPI} from "../../modules/auth/authAPI.ts";
import {loginSuccess} from "../../modules/auth/store/authSlice.ts";
import {useAppDispatch} from "../../store/hooks.ts";


interface ProtectedRouteProps {
    roles?: string[];
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ roles = [], children }: ProtectedRouteProps) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) throw new Error('No token');

                // Если пользователь не загружен в Redux, но есть токен
                if (!user) {
                    const userData = await authAPI.verify();
                    dispatch(loginSuccess(userData));
                }

                // Проверка ролей
                if (roles.length > 0 && (!user || !roles.some(role => user.role.includes(role)))) {
                    navigate('/permission-denied');
                }
            } catch (error) {
                localStorage.removeItem('access_token');
                navigate('/login');
            }
        };

        verifyAuth();
    }, [user, roles, navigate]);

    return children ? children : <Outlet />;
};