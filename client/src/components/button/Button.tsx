import React from "react";
import classes from './styles.module.css';
import Loader from "../loader/Loader.tsx";

type ButtonPropsType = {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    fullWidth?: boolean;
    disabled?: boolean;
    loading?: boolean;
    children?: React.ReactNode;
    type?: "button" | "submit" | "reset";
    className?: string;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost' | 'clear';
    size?: 'icon' | 'sm' | 'md' | 'lg';
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
    // Для варианта 'clear' используем отдельный класс без смешивания с другими стилями
    const buttonClasses = variant === 'clear'
        ? classes.clearButton
        : [
            classes.button,
            classes[variant],
            classes[size],
            fullWidth ? classes.fullWidth : '',
            loading ? classes.loading : '',
            icon ? classes.withIcon : '',
            className
        ].filter(Boolean).join(' ');

    // Если это кнопка очистки, используем оригинальную разметку
    if (variant === 'clear') {
        return (
            <button
                type={type}
                className={classes.clearButton}
                onClick={onClick}
                disabled={disabled || loading}
                aria-label="Очистить"
            >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
        );
    }

    // Для остальных вариантов используем стандартную разметку
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
                    {children && <span className={classes.children}>{children}</span>}
                    {icon && iconPosition === 'right' && (
                        <span className={classes.icon}>{icon}</span>
                    )}
                </>
            )}
        </button>
    );
};

export default Button;