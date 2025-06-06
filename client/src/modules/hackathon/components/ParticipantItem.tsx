import classes from '../hackathon.module.css';
import {Participant} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import {useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";

type ParticipantItemProps = {
    participant: Participant;
    hackathonId: number
};


const ParticipantItem = (props: ParticipantItemProps) => {
    const [participant, setParticipant] = useState<Participant>(props.participant)

    const [loading, setLoading] = useState<boolean> (false)

    const handleInvite = (id: number) => {
        setLoading(true)
        HackathonAPI.inviteToTeam(props.hackathonId, id)
            .then(() =>
                setParticipant((prevState) => ({
                    ...prevState,
                    canInvite: 2
                })
        )).finally(() => {setLoading(false)})
    }


    return (
        <div className={classes.card}>
            <p className={classes.title}>{participant.username}</p>
            <p className={classes.info}>Команда: {participant.team ? participant.team : <span className={classes.documentsHelp}>нет</span>}</p>
            {participant.canInvite == 1 &&
                <Button
                size={'sm'}
                variant={"secondary"}
                loading={loading}
                onClick={() =>handleInvite(participant.id)}>
                        Пригласить в команду
                </Button>}
            {participant.canInvite == 2 && <p>Приглашение уже отправлено</p>}
        </div>
    );
};

export default ParticipantItem;