import React, {useEffect} from "react";
import {logoutAPI} from "./logoutAPI.ts";
import {useNavigate} from "react-router-dom";

const Logout: React.FC = () => {
    const navigate = useNavigate()
    useEffect(() => {
        logoutAPI.logout().then(() => navigate("/login"))
    }, []);
    return (<></>);
};

export default Logout;