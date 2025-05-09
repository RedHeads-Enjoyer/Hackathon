import  { useState } from 'react';
import classes from '../hackathon.module.css';
import {Participant} from '../types.ts';

type ParticipantItemProps = {
    participant: Participant;
};

const ParticipantItem = (props: ParticipantItemProps) => {
    const [changeStatusLoading, setChangeStatusLoading] = useState<boolean>(false);
    const [participant, setParticipant] = useState<Participant>(props.participant);

    return (
        <div className={classes.card}>
            <h3 className={classes.title}>{participant.username}</h3>
            <p className={classes.info}>{participant.team}</p>

        </div>
    );
};

export default ParticipantItem;