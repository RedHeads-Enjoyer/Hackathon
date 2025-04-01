import React from "react";
import classes from './styles.module.css'
import Loader from "../loader/Loader.tsx";

type ButtonPropsType = {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;
    children: string;
}

const Button: React.FC<ButtonPropsType> = (props) => {
    return (
        <>
            <button
                onClick={props.onClick}
                className={classes.button}
                disabled={props.loading}
            >
                {props.loading ? <Loader/> : <p className={classes.children}>{props.children}</p>}
            </button>
        </>

    );
};

export default Button;