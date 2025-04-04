import React, { useEffect, useRef } from 'react';
import classes from './style.module.css';

interface TextAreaProps {
    label: string;
    name?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    minRows?: number;
    maxRows?: number;
    disabled?: boolean;
    className?: string;
}

const TextArea: React.FC<TextAreaProps> = ({
                                               label,
                                               name = '',
                                               value,
                                               onChange,
                                               placeholder = '',
                                               minRows = 2,
                                               maxRows = 6,
                                               disabled = false,
                                               className = '',
                                           }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const labelRef = useRef<HTMLLabelElement>(null);

    // Автоматическое изменение высоты
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight) || 20;
            const maxHeight = lineHeight * maxRows;
            const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
            textareaRef.current.style.height = `${Math.max(newHeight, lineHeight * minRows)}px`;
        }
    }, [value, minRows, maxRows]);

    return (
        <div className={`${classes.textAreaWrapper} ${className}`}>
            <label
                ref={labelRef}
                htmlFor={name}
                className={`${classes.label} ${disabled ? classes.labelDisabled : ''}`}
            >
                {label}
            </label>

            <div className={`${classes.textAreaContainer} ${disabled ? classes.disabled : ''}`}>
        <textarea
            ref={textareaRef}
            id={name}
            name={name}
            className={classes.textArea}
            value={value}
            placeholder={placeholder}
            disabled={disabled}
            onChange={onChange}
            rows={minRows}
            aria-labelledby={labelRef.current?.id}
        />
            </div>
        </div>
    );
};

export default TextArea;