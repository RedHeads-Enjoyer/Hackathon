import classes from '../hackathon.module.css';
import {TeamParticipant} from '../types.ts';

type ParticipantItemProps = {
    participant: TeamParticipant;
};

const teamRoles: Record<number, string> = {
    1: "Участник",
    2: "Глава"
};

const ParticipantItem = (props: ParticipantItemProps) => {
    const roleName = teamRoles[props.participant.teamRole] || `Роль ${props.participant.teamRole}`;
    return (
        <div className={classes.card}>
            <h3 className={classes.title}>{props.participant.username}</h3>
            <p className={classes.info}>Роль: {roleName}</p>
        </div>
    );
};

export default ParticipantItem;