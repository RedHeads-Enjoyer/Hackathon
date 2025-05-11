import React, {useEffect, useId, useRef} from 'react';
import classes from './style.module.css';

interface TextAreaProps {
    label?: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>; // Добавлен обработчик клавиш
    placeholder?: string;
    minRows?: number;
    maxRows?: number;
    disabled?: boolean;
    className?: string;
    error?: string;
    required?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({
                                               label,
                                               name = '',
                                               value,
                                               onChange,
                                               onKeyDown, // Добавлен параметр
                                               placeholder = '',
                                               minRows = 3,
                                               maxRows = 8,
                                               disabled = false,
                                               className = '',
                                               error = '',
                                               required = false,
                                           }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const id = useId();

    useEffect(() => {
        if (textareaRef.current) {
            // Рассчитываем высоту на основе line-height
            const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight) || 24;
            const minHeight = lineHeight * minRows;
            const maxHeight = lineHeight * maxRows;

            textareaRef.current.style.height = 'auto';
            const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
            textareaRef.current.style.height = `${Math.max(newHeight, minHeight)}px`;
        }
    }, [value, minRows, maxRows]);

    return (
        <div className={`${classes.textAreaWrapper} ${className}`}>
            <label
                htmlFor={id}
                className={`${classes.label} ${disabled ? classes.labelDisabled : ''}`}
            >
                {label}
                {required && <span className={classes.required}> *</span>}
            </label>

            <div className={`${classes.textAreaContainer} ${disabled ? classes.disabled : ''} ${error ? classes.error : ''}`}>
                <textarea
                    ref={textareaRef}
                    id={id}
                    name={name}
                    className={classes.textArea}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    onChange={onChange}
                    onKeyDown={onKeyDown} // Добавлен обработчик клавиш
                    rows={minRows}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : undefined}
                    required={required}
                />
            </div>

            {error && (
                <div id={`${id}-error`} className={classes.errorMessage}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default TextArea;