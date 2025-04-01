import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks.ts';
import {JSX} from "react";

type ProtectedRoutePropsType = {
    roles?: string[];
    children: JSX.Element | JSX.Element[];
}

const ProtectedRoute = ({ roles, children }: ProtectedRoutePropsType) => {
    const { user, loading } = useAppSelector((state) => state.auth);

    if (loading) {
        return <div>Загрузка...</div>;
    }


    if (!user || roles && !roles.includes(user.role)) {
        return <Navigate to="/permission-denied" replace />;
    }

    return children;
};

export default ProtectedRoute;