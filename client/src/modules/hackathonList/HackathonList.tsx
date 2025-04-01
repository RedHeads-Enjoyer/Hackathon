import React from "react";
import {authAPI} from "../auth/authAPI.ts";

const HackathonList: React.FC = () => {

    return (
        <button onClick={async() => {
            const pong = await  authAPI.ping()
            console.log(pong)
        }}>
            asdasd
        </button>
    );
};

export default HackathonList;