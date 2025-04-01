import React, { useEffect } from "react";
import { authAPI } from "./authAPI";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import { logout } from "./store/authSlice";

const Logout: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await authAPI.logout();
            } catch (error) {
                console.error("Logout API error:", error);
            } finally {
                dispatch(logout());
                window.location.href = '/login';
            }
        };

        performLogout();
    }, [dispatch, navigate]);

    return null;
};

export default Logout;