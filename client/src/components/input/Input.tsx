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
    min?: number; // Минимальное значение
    max?: number; // Максимальное значение
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
            const isValidInput = value === '' || /^[0-9]*$/.test(value);
            let numValue = value === '' ? undefined : parseInt(value);

            if (isValidInput) {
                // Ограничение по максимальному значению
                if (props.max !== undefined && numValue !== undefined && numValue > props.max) {
                    numValue = props.max;
                }
                // Ограничение по минимальному значению
                if (props.min !== undefined && numValue !== undefined && numValue < props.min) {
                    numValue = props.min; // Применяем min
                }

                const syntheticEvent = {
                    ...e,
                    target: {
                        ...e.target,
                        value: numValue !== undefined ? numValue.toString() : '',
                        name: e.target.name
                    }
                } as React.ChangeEvent<HTMLInputElement>;

                props.onChange(syntheticEvent);

                // Обновляем состояния предупреждений
                setMaxWarningVisible(numValue === props.max);
                setMinWarningVisible(numValue === props.min);
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
        // Скрываем предупреждения при потере фокуса
        setWarningVisible(false);
        setMaxWarningVisible(false);
        setMinWarningVisible(false);

        if (props.type === 'number') {
            const numValue = parseInt(e.target.value);

            if (e.target.value === '') {
                // Устанавливаем значение в min или max, если они заданы
                const newValue =
                    props.min !== undefined ? props.min :
                        props.max !== undefined ? props.max :
                            0; // В противном случае устанавливаем 0

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
                let constrainedValue = numValue;

                // Ограничиваем значение нижней границей
                if (props.min !== undefined && numValue < props.min) {
                    constrainedValue = props.min;
                    setMinWarningVisible(true); // Показать предупреждение о min
                }

                // Ограничиваем значение верхней границей
                if (props.max !== undefined && numValue > props.max) {
                    constrainedValue = props.max;
                    setMaxWarningVisible(true); // Показать предупреждение о max
                }

                // Если значение изменилось после ограничений, создаем синтетическое событие
                if (constrainedValue !== numValue) {
                    const syntheticEvent = {
                        ...e,
                        target: {
                            ...e.target,
                            value: constrainedValue.toString(),
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
        setMaxWarningVisible(!!props.max && props.value === props.max);
        setMinWarningVisible(!!props.min && props.value === props.min); // Предупреждение о min при фокусе

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
                type={props.type === 'number' ? 'text' : props.type} // Используем 'text', чтобы избежать автоматической проверки ввода
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
            {minWarningVisible && ( // Предупреждение о минимальном значении
                <div className={classes.warning_message}>Достигнуто минимальное значение</div>
            )}
            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Input;