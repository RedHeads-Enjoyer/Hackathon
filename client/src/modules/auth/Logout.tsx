import React, {useEffect} from "react";
import {authAPI} from "./authAPI.ts";
import {useNavigate} from "react-router-dom";

const Logout: React.FC = () => {
    const navigate = useNavigate()
    useEffect(() => {
        authAPI.logout().then(() => navigate("/login"))
    }, []);
    return (<></>);
};

export default Logout;