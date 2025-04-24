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
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonPropsType> = ({
                                               onClick,
                                               fullWidth = false,
                                               disabled = false,
                                               loading = false,
                                               children,
                                               type = "button",
                                               className = '',
                                               variant = 'primary',
                                               size = 'md',
                                               icon,
                                               iconPosition = 'left'
                                           }) => {
    const buttonClasses = [
        classes.button,
        classes[variant],
        classes[size],
        fullWidth ? classes.fullWidth : '',
        loading ? classes.loading : '',
        icon ? classes.withIcon : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            onClick={onClick}
            className={buttonClasses}
            disabled={disabled || loading}
            type={type}
            data-icon-position={iconPosition}
        >
            {loading ? (
                <Loader size="small" color={variant === 'ghost' ? 'primary' : 'light'} />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <span className={classes.icon}>{icon}</span>
                    )}
                    <span className={classes.children}>{children}</span>
                    {icon && iconPosition === 'right' && (
                        <span className={classes.icon}>{icon}</span>
                    )}
                </>
            )}
        </button>
    );
};

export default Button;