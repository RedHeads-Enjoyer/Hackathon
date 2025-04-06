import React from "react";
import classes from './styles.module.css';
import Loader from "../loader/Loader.tsx";

type ButtonPropsType = {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;
    children: React.ReactNode;
    type?: "button" | "submit" | "reset";
    className?: string;
}

const Button: React.FC<ButtonPropsType> = ({
                                               onClick,
                                               fullWidth = false,
                                               disabled = false,
                                               loading = false,
                                               children,
                                               type = "button",
                                               className = ''
                                           }) => {
    const buttonClasses = [
        classes.button,
        fullWidth ? classes.fullWidth : '',
        loading ? classes.loading : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            onClick={onClick}
            className={buttonClasses}
            disabled={disabled || loading}
            type={type}
        >
            {loading ?
                <Loader size="small" color="dark" />
                :
                <span className={classes.children}>{children}</span>
            }
        </button>
    );
};

export default Button;