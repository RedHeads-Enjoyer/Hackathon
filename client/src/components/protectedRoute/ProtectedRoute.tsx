import {useSelector} from "react-redux";
import {RootState} from "../../store/store.ts";
import {Outlet, useNavigate} from "react-router-dom";
import {useEffect} from "react";

interface ProtectedRouteProps {
    roleLevel: number;
    children?: React.ReactNode;
}

export const ProtectedRoute = ({ roleLevel, children }: ProtectedRouteProps) => {
    const { user } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else if (user.role < roleLevel) {
            navigate('/permission-denied');
        }
    }, [user, roleLevel, navigate]);

    return children ? children : <Outlet />;
};