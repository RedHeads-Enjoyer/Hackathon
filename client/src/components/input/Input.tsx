import React from "react";
import { useId } from 'react';
import classes from './styles.module.css';

type InputPropsType = {
    type: "text" | "email" | "password" | "number" | "textNumber";
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Добавлен новый проп
    name?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    min?: number;
    max?: number;
    maxLength?: number,
    required?: boolean;
}

const Input = (props: InputPropsType) => {
    const inputId = useId();

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (props.maxLength && e.target.value.length > props.maxLength) {
            return;
        }

        props.onChange({ target: { name: props.name, value: props.value } } as React.ChangeEvent<HTMLInputElement>);
        
        if (props.type === 'number') {
            if (e.target.value === '' || !isNaN(Number(e.target.value))) {
                props.onChange(e);
            }
        } else if (props.type === 'textNumber'){
            if (e.target.value === '' || !isNaN(Number(e.target.value))) {
                props.onChange(e);
            }
        } else {
            props.onChange(e);
        }
    };

    const isError = props.error;

    return (
        <div className={`${classes.input_container} ${isError ? classes.error : ''}`}>
            {props.label && (
                <label htmlFor={inputId} className={classes.label}>
                    {props.label}
                    {props.required && <span className={classes.required}> *</span>} {/* Звездочка для обязательного поля */}
                </label>
            )}
            <input
                id={inputId}
                type={props.type}
                value={props.value}
                name={props.name}
                onChange={handleNumberChange}
                onKeyDown={props.onKeyDown}
                placeholder={props.placeholder}
                min={props.type === 'number' ? props.min : undefined}
                max={props.type === 'number' ? props.max : undefined}
                required={props.required}
            />
            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Input;