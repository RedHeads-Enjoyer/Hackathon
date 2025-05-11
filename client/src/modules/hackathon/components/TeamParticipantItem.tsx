import classes from '../hackathon.module.css';
import {TeamParticipant} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import {useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";
import Modal from "../../../components/modal/Modal.tsx";

type ParticipantItemProps = {
    participant: TeamParticipant;
    hackathonId: number;
    searchTeam: () => void;
    teamRole: number;
};

const teamRoles: Record<number, string> = {
    1: "Участник",
    2: "Глава"
};

const ParticipantItem = (props: ParticipantItemProps) => {
    const [isKickModalOpen, setIsKickModalOpen] = useState<boolean>(false)
    const [isKickLoading, setIsKickLoading] = useState<boolean>(false)

    const handleKick = () => {
        setIsKickLoading(true)
        setIsKickModalOpen(false)
        HackathonAPI.kickTeam(props.hackathonId, props.participant.id)
            .then(() => {
                props.searchTeam()
            })
            .finally(() => {
                setIsKickLoading(false)
            })
    }

    const roleName = teamRoles[props.participant.teamRole] || `Роль ${props.participant.teamRole}`;
    return (
        <div className={`${classes.card} ${classes.team_card}`}>
            <div>
                <h3 className={classes.title}>{props.participant.username}</h3>
                <p className={classes.info}>Роль: {roleName}</p>
            </div>
            {props.teamRole == 2 && props.participant.teamRole == 1 &&
                <Button
                    size={"sm"}
                    variant={"danger"}
                    loading={isKickLoading}
                    onClick={() => setIsKickModalOpen(true)}
                >Выгнать</Button>
            }
            <Modal
                isOpen={isKickModalOpen}
                rejectText={"Отмена"}
                confirmText={"Подтверждаю"}
                title={"Подтверждение действия"}
                onReject={() => setIsKickModalOpen(false)}
                onConfirm={handleKick}
            >
                <p>Подтвердите кик участника</p>
            </Modal>
        </div>
    );
};

export default ParticipantItem;