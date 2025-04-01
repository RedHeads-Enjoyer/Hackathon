import React from "react";
import classes from './styles.module.css'

type PageLabelPropsType = {
    text: string,
}

const PageLabel: React.FC<PageLabelPropsType> = (props) => {

    return (<h3 className={classes.label}>{props.text}</h3>);
};

export default PageLabel;