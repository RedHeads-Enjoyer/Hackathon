import React from "react";
import { useId } from 'react';
import classes from './styles.module.css';

type InputPropsType = {
    type: "text" | "email" | "password" | "number" | "textNumber";
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    name?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    min?: number;
    max?: number;
    maxLength?: number,
    required?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}

const Input = (props: InputPropsType) => {
    const inputId = useId();
    const isError = props.error;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        // Check maxLength constraint
        if (props.maxLength && value.length > props.maxLength) {
            return;
        }

        if (props.type === 'number') {
            // Allow: empty string, minus sign, digits, and at most one decimal point
            // This regex matches valid number patterns including negative numbers and decimals
            const isValidInput = value === '' || value === '-' || /^-?\d*\.?\d*$/.test(value);

            if (isValidInput) {
                props.onChange(e);
            }
        } else if (props.type === 'textNumber') {
            // For textNumber, only allow digits
            if (value === '' || /^\d+$/.test(value)) {
                props.onChange(e);
            }
        } else {
            // For other types, no validation needed
            props.onChange(e);
        }
    };

    // Handle blur to validate against min/max
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (props.type === 'number' && e.target.value !== '' && e.target.value !== '-') {
            const numValue = parseFloat(e.target.value);

            // Only apply constraints if we have a valid number
            if (!isNaN(numValue)) {
                let constrainedValue = numValue;

                // Apply min constraint if specified
                if (props.min !== undefined && numValue < props.min) {
                    constrainedValue = props.min;
                }

                // Apply max constraint if specified
                if (props.max !== undefined && numValue > props.max) {
                    constrainedValue = props.max;
                }

                // If value changed due to constraints, update it
                if (constrainedValue !== numValue) {
                    const syntheticEvent = Object.create(e);
                    syntheticEvent.target = { ...e.target, value: constrainedValue.toString() };
                    props.onChange(syntheticEvent);
                }
            }
        }

        // Call the original onBlur if provided
        if (props.onBlur) {
            props.onBlur();
        }
    };

    return (
        <div className={`${classes.input_container} ${isError ? classes.error : ''}`}>
            {props.label && (
                <label htmlFor={inputId} className={classes.label}>
                    {props.label}
                    {props.required && <span className={classes.required}> *</span>}
                </label>
            )}
            <input
                id={inputId}
                type={props.type === 'number' ? 'text' : props.type}
                value={props.value}
                name={props.name}
                onChange={handleInputChange}
                onKeyDown={props.onKeyDown}
                placeholder={props.placeholder}
                required={props.required}
                onFocus={props.onFocus}
                onBlur={handleBlur}
                inputMode={props.type === 'number' ? 'numeric' : undefined}
                className={`${props.type === 'number' ? classes.number_input : ''}`}
            />
            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Input;