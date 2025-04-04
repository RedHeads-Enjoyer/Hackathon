import React from 'react';
import classes from './style.module.css';

interface ModalProps {
    isOpen: boolean;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
    if (!isOpen) return null;

    return (
        <div className={classes.modalOverlay}>
            <div className={classes.modalContent}>
                {children}
            </div>
        </div>
    );
};

export default Modal;