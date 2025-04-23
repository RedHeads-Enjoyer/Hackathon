import React from "react";
import { useId } from 'react';
import classes from './styles.module.css'

type InputPropsType = {
    type: "text" | "email" | "password" | "number";
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Добавлен новый проп
    name?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    min?: number;
    max?: number;
    step?: number;
}

const Input = (props: InputPropsType) => {
    const inputId = useId();

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        props.onChange({ target: { name: props.name, value: props.value } } as React.ChangeEvent<HTMLInputElement>)
        if (props.type === 'number') {
            if (e.target.value === '' || !isNaN(Number(e.target.value))) {
                props.onChange(e);
            }
        } else {
            props.onChange(e);
        }
    };

    const isError = props.error

    return (
        <div className={`${classes.input_container} ${isError ? classes.error : ''}`}>
            {props.label && <label htmlFor={inputId} className={classes.label}>{props.label}</label>}
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
                step={props.type === 'number' ? props.step : undefined}
            />
            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Input;