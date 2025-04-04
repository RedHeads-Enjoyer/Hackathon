import React from 'react';
import classes from './style.module.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div className={classes.modalOverlay}>
            <div className={classes.modalContent}>
                <button className={classes.closeButton} onClick={onClose}>×</button>
                {children}
            </div>
        </div>
    );
};

export default Modal;