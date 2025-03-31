import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks.ts';
import {JSX} from "react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const { user, loading } = useAppSelector((state) => state.auth);

    if (loading) {
        console.log("asdasd")
        return <div>Загрузка...</div>;
    }


    if (!user) {
        console.log("qweqwe")
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;