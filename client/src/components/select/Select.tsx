import { useState, useId, useEffect, useRef } from 'react';
import classes from './style.module.css';
import Loader from "../loader/Loader.tsx";

type SelectPropsType = {
    options: { value: number; label: string }[];
    value: number;
    onChange: (value: number) => void;
    name?: string;
    placeholder?: string;
    label?: string;
    error?: string | null;
    required?: boolean;
    loading?: boolean;
    horizontal?: boolean;
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
        if (props.loading) return;
        props.onChange(value);
        setIsOpen(false);
    };

    const selectedLabel = props.options.find(opt => opt.value === props.value)?.label || props.placeholder || 'Select...';

    return (
        <div className={`${classes.select_container} ${isError ? classes.error : ''}`} ref={selectRef}>
            <div className={props.horizontal ? classes.horizontal :""}>
                {props.label && (
                    <label htmlFor={selectId} className={classes.label}>
                        {props.label}
                        {props.required && <span className={classes.required}> *</span>}
                    </label>
                )}

                <div
                    className={`${isOpen ? classes.open : ''} ${props.loading ? classes.select : classes.selectLoading}`}
                    onClick={() => {
                        if (props.loading) return
                        setIsOpen(!isOpen)
                    }}
                    id={selectId}
                >
                    <div className={classes.selected_value}>
                        {props.loading ? <Loader/> : <>{selectedLabel}</>}


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
            </div>


            {props.error && <div className={classes.error_message}>{props.error}</div>}
        </div>
    );
};

export default Select;