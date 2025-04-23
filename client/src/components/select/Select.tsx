import { useState, useId, useEffect, useRef } from 'react';
import classes from './style.module.css';

type SelectPropsType = {
    options: { value: number; label: string }[];
    value: number;
    onChange: (value: number) => void;
    name?: string;
    placeholder?: string;
    label?: string;
    error?: string;
    required?: boolean;
};

const Select = (props: SelectPropsType) => {
    const selectId = useId();
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const isError = props.error;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleOptionClick = (value: number) => {
        props.onChange(value);
        setIsOpen(false);
    };

    const selectedLabel = props.options.find(opt => opt.value === props.value)?.label || props.placeholder || 'Select...';

    return (
        <div className={`${classes.select_container} ${isError ? classes.error : ''}`} ref={selectRef}>
            {props.label && (
                <label htmlFor={selectId} className={classes.label}>
                    {props.label}
                    {props.required && <span className={classes.required}> *</span>}
                </label>
            )}

            <div
                className={`${classes.select} ${isOpen ? classes.open : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                id={selectId}
            >
                <div className={classes.selected_value}>
                    {selectedLabel}
                    <span className={classes.arrow}></span>
                </div>

                {isOpen && (
                    <div className={classes.options_list}>
                        {props.options.map(option => (
                            <div
                                key={option.value}
                                className={`${classes.option} ${props.value === option.value ? classes.selected : ''}`}
                                onClick={() => handleOptionClick(option.value)}
                            >
                                {option.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Select;