import React from "react";
import classes from './styles.module.css';

type PageLabelPropsType = {
    children: React.ReactNode;
    size?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // 6 вариантов размера
    className?: string; // Дополнительные классы
};

const PageLabel: React.FC<PageLabelPropsType> = ({
                                                     children,
                                                     size = 'h3', // По умолчанию h3
                                                     className = ''
                                                 }) => {
    // Формируем классы: базовый + размер + переданные классы
    const labelClasses = `${classes.label} ${classes[size]} ${className}`.trim();

    return (
        // Используем соответствующий HTML-тег (h1-h6) в зависимости от размера
        React.createElement(size, { className: labelClasses }, children)
    );
};

export default PageLabel;