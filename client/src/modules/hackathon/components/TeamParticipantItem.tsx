import classes from '../hackathon.module.css';
import {TeamParticipant} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import {useState} from "react";
import Modal from "../../../components/modal/Modal.tsx";
import {HackathonAPI} from "../hackathonAPI.ts";

type ParticipantItemProps = {
    participant: TeamParticipant;
    hackathonId: number;
    searchTeam: () => void;
};

const teamRoles: Record<number, string> = {
    1: "Участник",
    2: "Глава"
};

const ParticipantItem = (props: ParticipantItemProps) => {
    const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false)
    const [isDisbandLoading, setIsDisbandLoading] = useState<boolean>(false)

    const handleDisband = () => {
        setIsDisbandLoading(true)
        setIsDisbandModalOpen(false)
        HackathonAPI.deleteTeam(props.hackathonId)
            .then(() => {
                props.searchTeam()
            })
            .finally(() => {
                setIsDisbandLoading(false)
            })
    }

    const roleName = teamRoles[props.participant.teamRole] || `Роль ${props.participant.teamRole}`;
    return (
        <div className={`${classes.card} ${classes.team_card}`}>
            <div>
                <h3 className={classes.title}>{props.participant.username}</h3>
                <p className={classes.info}>Роль: {roleName}</p>
            </div>
            {props.participant.teamRole == 2 ?
                <Button
                    variant={"danger"}
                    size={"sm"}
                    loading={isDisbandLoading}
                    onClick={() => setIsDisbandModalOpen(true)}
                >
                    Расформировать команду
                </Button> : <></>}
            <Modal
               isOpen={isDisbandModalOpen}
               rejectText={"Отмена"}
               confirmText={"Подтверждаю"}
               title={"Подтверждение действия"}
               onReject={() => setIsDisbandModalOpen(false)}
               onConfirm={handleDisband}
            >
                <p>Подтвердите расформирование команды</p>
            </Modal>
        </div>
    );
};

export default ParticipantItem;