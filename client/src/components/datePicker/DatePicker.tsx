import React, { useState } from 'react';
import classes from './styles.module.css';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    minDate?: string;
    maxDate?: string;
    required?: boolean; // новое свойство для обязательности
    error?: string; // новое свойство для ошибки
}

const DatePicker: React.FC<DatePickerProps> = ({
                                                   value,
                                                   onChange,
                                                   label,
                                                   minDate,
                                                   maxDate,
                                                   required = false,
                                                   error
                                               }) => {
    const [isFocused, setIsFocused] = useState(false);

    // Добавляем класс ошибки, если она есть
    const containerClass = `${classes.datePickerContainer} ${isFocused ? classes.focused : ''} ${error ? classes.error : ''}`;

    return (
        <div className={containerClass}>
            {label && (
                <label className={classes.label}>
                    {label}
                    {required && <span className={classes.required}>*</span>}
                </label>
            )}
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                min={minDate}
                max={maxDate}
                className={classes.dateInput}
                required={required}
            />
            <div className={classes.calendarIcon}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 2V6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 2V6" stroke="currentColor" strokeWidth="2"/>
                    <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                </svg>
            </div>

            {/* Отображаем сообщение об ошибке */}
            {error && <div className={classes.errorMessage}>{error}</div>}
        </div>
    );
};

export default DatePicker;