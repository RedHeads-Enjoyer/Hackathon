import classes from './styles.module.css';

interface LoaderProps {
    color?: string;
}

const Loader = (props: LoaderProps) => {
    return (
        <div className={classes.loader_container}>
            {props.color != null ?
                <>
                    <div className={classes.loader_dot} style={{ backgroundColor: props.color }} />
                    <div className={classes.loader_dot} style={{ backgroundColor: props.color }} />
                    <div className={classes.loader_dot} style={{ backgroundColor: props.color }} />
                </>
                :
                <>
                    <div className={classes.loader_dot}/>
                    <div className={classes.loader_dot}/>
                    <div className={classes.loader_dot}/>
                </>
            }

        </div>
    );
};

export default Loader;