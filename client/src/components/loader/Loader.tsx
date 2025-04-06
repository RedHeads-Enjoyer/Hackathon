import classes from './styles.module.css';

interface LoaderProps {
    color?: 'primary' | 'light' | 'dark' | 'white' | string;
    size?: 'small' | 'medium' | 'large';
}

const Loader = ({ color = 'primary', size = 'medium' }: LoaderProps) => {
    const sizeClasses = {
        small: classes.small,
        medium: classes.medium,
        large: classes.large,
    };

    const getDotClass = () => {
        if (typeof color === 'string' && ['primary', 'light', 'dark', 'white'].includes(color)) {
            return classes[color];
        }
        return '';
    };

    const dotStyle = typeof color === 'string' && !['primary', 'light', 'dark', 'white'].includes(color)
        ? { backgroundColor: color }
        : {};

    return (
        <div className={`${classes.loader_container} ${sizeClasses[size]}`}>
            <div
                className={`${classes.loader_dot} ${getDotClass()}`}
                style={dotStyle}
            />
            <div
                className={`${classes.loader_dot} ${getDotClass()}`}
                style={dotStyle}
            />
            <div
                className={`${classes.loader_dot} ${getDotClass()}`}
                style={dotStyle}
            />
        </div>
    );
};

export default Loader;