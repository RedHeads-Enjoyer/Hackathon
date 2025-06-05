import React, { useState } from "react";
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
    maxLength?: number;
    required?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
    disabled?: boolean;
}

const Input = (props: InputPropsType) => {
    const inputId = useId();
    const isError = props.error;
    const [warningVisible, setWarningVisible] = useState<boolean>(false);
    const [maxWarningVisible, setMaxWarningVisible] = useState<boolean>(false);
    const [minWarningVisible, setMinWarningVisible] = useState<boolean>(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (props.maxLength && value.length > props.maxLength) {
            return;
        }

        if (props.type === 'number') {
            // Только проверяем на цифры, без min/max
            const isValidInput = value === '' || /^[0-9]*$/.test(value);

            if (isValidInput) {
                props.onChange(e);
            }
        } else if (props.type === 'textNumber') {
            if (value === '' || /^\d+$/.test(value)) {
                props.onChange(e);
            }
        } else {
            props.onChange(e);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setWarningVisible(false);
        setMaxWarningVisible(false);
        setMinWarningVisible(false);

        if (props.type === 'number') {
            const currentValue = e.target.value;
            const numValue = parseInt(currentValue);

            if (currentValue === '') {
                // Устанавливаем min, если он задан, иначе max, иначе 0
                const newValue =
                    props.min !== undefined ? props.min :
                        props.max !== undefined ? props.max :
                            0;

                const syntheticEvent = {
                    ...e,
                    target: {
                        ...e.target,
                        value: newValue.toString(),
                        name: e.target.name
                    }
                } as React.ChangeEvent<HTMLInputElement>;

                props.onChange(syntheticEvent);
            } else if (!isNaN(numValue)) {
                let newValue = numValue;
                let shouldUpdate = false;

                // Проверка минимального значения
                if (props.min !== undefined && numValue < props.min) {
                    newValue = props.min;
                    shouldUpdate = true;
                    setMinWarningVisible(true);
                }

                // Проверка максимального значения
                if (props.max !== undefined && numValue > props.max) {
                    newValue = props.max;
                    shouldUpdate = true;
                    setMaxWarningVisible(true);
                }

                // Обновляем значение, если нужно
                if (shouldUpdate) {
                    const syntheticEvent = {
                        ...e,
                        target: {
                            ...e.target,
                            value: newValue.toString(),
                            name: e.target.name
                        }
                    } as React.ChangeEvent<HTMLInputElement>;

                    props.onChange(syntheticEvent);
                }
            }
        }

        if (props.onBlur) {
            props.onBlur();
        }
    };

    const handleFocus = () => {
        setWarningVisible(!!props.maxLength);
        // Убираем логику min/max отсюда
        setMaxWarningVisible(!!props.max && props.value === props.max);
        setMinWarningVisible(!!props.min && props.value === props.min);

        if (props.onFocus) {
            props.onFocus();
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                inputMode={props.type === 'number' ? 'numeric' : undefined}
                disabled={props.disabled}
                className={`${props.type === 'number' ? classes.number_input : ''}`}
            />
            {(warningVisible && props.maxLength && String(props.value).length === props.maxLength) &&
                <div className={classes.warning_message}>Достигнута максимальная длина</div>
            }
            {maxWarningVisible && (
                <div className={classes.warning_message}>Достигнуто максимальное значение</div>
            )}
            {minWarningVisible && (
                <div className={classes.warning_message}>Достигнуто минимальное значение</div>
            )}
            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Input;