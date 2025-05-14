import React from "react";
import classes from './auth.module.css';

const PermissionDenied: React.FC = () => {
    return (<div className={classes.app_container}>
        <p className={classes.error}>У вас недостаточно прав</p>
        </div>);
};

export default PermissionDenied;