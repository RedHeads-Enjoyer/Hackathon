import { JSX } from "react";
import classes from './styles.module.css';

type ErrorPropsType = {
    children: JSX.Element[] | JSX.Element | string | null;
    className?: string;
}

const Error = (props: ErrorPropsType) => {
    return (
        <div className={`${classes.error_container} ${props.className || ''}`}>
            <div className={classes.error_content}>
                {props.children}
            </div>
        </div>
    );
};

export default Error;