import React, {useState} from "react";
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
    disabled?: boolean;
}

const Input = (props: InputPropsType) => {
    const inputId = useId();
    const isError = props.error;
    const [warningVisible, setWarningVisible] = useState<boolean>(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (props.maxLength && value.length > props.maxLength) {
            return;
        }

        if (props.type === 'number') {
            // Для числового поля размера команды разрешаем только положительные целые числа
            // Удалено '.' из регулярного выражения, т.к. размер команды - целое число
            const isValidInput = value === '' || /^[0-9]*$/.test(value);

            if (isValidInput) {
                // Проверяем, не выходит ли за пределы min/max при вводе
                if (value !== '') {
                    const numValue = parseInt(value);
                    if ((props.max !== undefined && numValue > props.max) ||
                        (props.min !== undefined && numValue < props.min)) {
                        // Просто не обновляем значение, если оно выходит за пределы
                        return;
                    }
                }
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

    // Handle blur to validate against min/max
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setWarningVisible(false)
        if (props.type === 'number' && e.target.value !== '') {
            const numValue = parseInt(e.target.value);

            if (!isNaN(numValue)) {
                let constrainedValue = numValue;

                // Ограничиваем значение нижней границей
                if (props.min !== undefined && numValue < props.min) {
                    constrainedValue = props.min;
                }

                // Ограничиваем значение верхней границей
                if (props.max !== undefined && numValue > props.max) {
                    constrainedValue = props.max;
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

        // Вызываем пользовательский обработчик onBlur, если он существует
        if (props.onBlur) {
            props.onBlur();
        }
    };

    const handleFocus = () => {
        setWarningVisible(!!props.maxLength)

        if (props.onFocus) {
            props.onFocus();
        }
    }

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
            {(warningVisible && props.maxLength && String(props.value).length == props.maxLength) &&
                <div className={classes.warning_message}>Достигнута максимальная длина</div>
            }
            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Input;