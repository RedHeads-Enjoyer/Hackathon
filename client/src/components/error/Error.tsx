import {JSX} from "react";
import classes from './styles.module.css'

type ErrorPropsType = {
    children: JSX.Element[] | JSX.Element | null
}

const Error = (props:ErrorPropsType) => {
    return (
        <div className={classes.error_container}>
            {props.children}
        </div>
    );
};

export default Error;