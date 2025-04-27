import React from 'react';
import classes from './style.module.css';
import Button from "../button/Button.tsx";

interface ModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onReject: () => any;
    title: string;
    children?: React.ReactNode;
    rejectText: string;
    confirmText: string;
}

const Modal: React.FC<ModalProps> = (props) => {
    if (!props.isOpen) return null;

    return (
        <div className={classes.modalOverlay}>
            <div className={classes.modalContent}>
                <h3 className={classes.modalTitle}>{props.title}</h3>
                {props.children}

                <div className={classes.modalActions}>
                    <Button
                        variant={"ghost"}
                        onClick={props.onReject}
                    >
                        {props.rejectText}
                    </Button>
                    <Button
                        onClick={props.onConfirm}
                    >
                        {props.confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Modal;