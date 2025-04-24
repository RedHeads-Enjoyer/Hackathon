import React, { useEffect, useState } from 'react';
import classes from './style.module.css';

export type NotificationProps = {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose?: () => void;
};

const Notification: React.FC<NotificationProps> = ({
                                                       message,
                                                       type = 'info',
                                                       duration = 5000,
                                                       onClose,
                                                   }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!isVisible) return null;

    const getNotificationClass = () => {
        switch (type) {
            case 'success':
                return classes.success;
            case 'error':
                return classes.error;
            case 'warning':
                return classes.warning;
            default:
                return classes.info;
        }
    };

    return (
        <div className={`${classes.notification} ${getNotificationClass()}`}>
            <div className={classes.notification_content}>
                <span>{message}</span>
            </div>
        </div>
    );
};

export default Notification;