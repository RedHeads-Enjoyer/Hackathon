import classes from '../hackathon.module.css';
import {Participant} from '../types.ts';

type ParticipantItemProps = {
    participant: Participant;
};

const ParticipantItem = (props: ParticipantItemProps) => {
    return (
        <div className={classes.card}>
            <h3 className={classes.title}>{props.participant.username}</h3>
            <p className={classes.info}>Команда: {props.participant.team ? props.participant.team : <span className={classes.documentsHelp}>нет</span>}</p>
        </div>
    );
};

export default ParticipantItem;