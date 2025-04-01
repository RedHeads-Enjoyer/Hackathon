import React from "react";
import { useId } from 'react';
import classes from './styles.module.css'

type InputPropsType = {
    type: "text" | "email" | "password";
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    label?: string;
    error?: string;
    id?: string;
}

const Input = (props: InputPropsType) => {
    const inputId = props.id || useId();

    return (
        <div className={classes.input_container}>
            {props.label && <label htmlFor={inputId} className={classes.label}>{props.label}</label>}
            <input
                id={inputId}
                type={props.type}
                value={props.value}
                name={props.name}
                onChange={props.onChange}
                placeholder={props.placeholder}
            />
        </div>
    );
};

export default Input;