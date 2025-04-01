import React, {useEffect} from "react";
import {authAPI} from "./authAPI.ts";
import {useNavigate} from "react-router-dom";
import {useAppDispatch} from "../../store/hooks.ts";
import {logout} from "./store/authSlice.ts";

const Logout: React.FC = () => {
    const navigate = useNavigate()
    const dispatch = useAppDispatch();

    useEffect(() => {
        authAPI.logout().then(() => {
            dispatch(logout());
            navigate("/login")
        })
    }, []);
    return (<></>);
};

export default Logout;