import {TeamCreate, TeamData, TeamInvite} from "../types.ts";
import React, {useEffect, useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";
import {useParams} from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import classes from  "../hackathon.module.css"
import Error from "../../../components/error/Error.tsx";
import Input from "../../../components/input/Input.tsx";
import Modal from "../../../components/modal/Modal.tsx";
import Button from "../../../components/button/Button.tsx";
import Loader from "../../../components/loader/Loader.tsx";
import TeamParticipantItem from "./TeamParticipantItem.tsx";
import {safeFormatDate} from "../OpenHackathon.tsx";

const TeamSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;
    const [isCreate, setIsCreate] = useState<boolean>(false)
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)
    const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
    const [acceptLoading, setAcceptLoading] = useState<boolean>(false)
    const [rejectLoading, setRejectLoading] = useState<boolean>(false)
    const [isDisbandLoading, setIsDisbandLoading] = useState<boolean>(false)
    const [isDisbandModalOpen, setIsDisbandModalOpen] = useState<boolean>(false)
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false)
    const [isLeaveLoading, setIsLeaveLoading] = useState<boolean>(false)

    const [formData, setFormData] = useState<TeamCreate>({
        name: ""
    })

    const [formErrors, setFormErrors] = useState<{name?: string}>({
        name: ""
    });

    const [team, setTeam] = useState<TeamData>({
        name: "",
        participants: [],
        teamRole: 0
    })

    const [teamLoading, setTeamLoading] = useState<boolean>(true)
    const [loadingError, setLoadingError] = useState<null | string>()
    const [createLoading, setCreateLoading] = useState<boolean>(false)
    const [createError, setCreateError] = useState<null | string>()

    const searchTeam = () => {
        setTeamLoading(true)
        setLoadingError(null);
        HackathonAPI.getTeam(hackathonId)
            .then((data) => {
                console.log(data)
                if (!data.name) {
                    HackathonAPI.getTeamInvites(hackathonId)
                        .then(data => setTeamInvites(data))
                    setIsCreate(true)
                } else {
                    setTeam(data);
                    setIsCreate(false);
                }
                setTeamLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при получении команды";
                setLoadingError(errorMessage);
            }).finally(() => {
            setTeamLoading(false);
        })
    }

    useEffect(() => {
        searchTeam()
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        setFormErrors(prev => ({
            ...prev,
            [name]: undefined
        }));
    };

    const validateForm = () => {
        const errors: {name?: string} = {};
        if (!formData.name) {
            errors.name = "Название команды не может быть пустым";
        }

        return errors
    };

    const handleCreateClick = () => {
        setIsPublishModalOpen(true);
    };

    const confirmCreate = async () => {
        setIsPublishModalOpen(false)
        setCreateLoading(true);
        setCreateError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setCreateError(null);
            setCreateLoading(false);
            setFormData({name: ""})
            return;
        }

        try {
            HackathonAPI.createTeam(hackathonId, formData)
                .then(() => searchTeam());
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при создании организации";
            setCreateError(errorMessage);
        } finally {
            setCreateLoading(false);
        }
    };

    const handleReject = (id: number) => {
        setRejectLoading(true)
        HackathonAPI.rejectTeamInvite(id)
            .then(() => searchTeam())
            .finally(() => setRejectLoading(false))
    }

    const handleAccept = (id: number) => {
        setAcceptLoading(true)
        HackathonAPI.acceptTeamInvite(id)
            .then(() => searchTeam())
            .finally(() => setAcceptLoading(false))
    }

    const getStatusText = (status: number) => {
        switch(status) {
            case 0: return "Ожидает ответа";
            case 1: return "Принято";
            case -1: return "Отклонено";
            default: return "Неизвестный статус";
        }
    }

    const handleDisband = () => {
        setIsDisbandLoading(true)
        setIsDisbandModalOpen(false)
        HackathonAPI.deleteTeam(hackathonId)
            .then(() => {
                searchTeam()
            })
            .finally(() => {
                setIsDisbandLoading(false)
            })
    }

    const handleLeave = () => {
        setIsLeaveLoading(true)
        setIsLeaveModalOpen(false)
        HackathonAPI.leaveTeam(hackathonId)
            .then(() => {
                searchTeam()
            })
            .finally(() => {
                setIsLeaveLoading(false)
            })
    }


    return (
        <div className={classes.page_wrapper}>
            {teamLoading ? < Loader/> :
                <>

                    {isCreate ?
                        <>
                        <PageLabel size={'h3'}>Приглашения в команды</PageLabel>
                            {teamInvites.length == 0 ?
                                <div className={classes.card}><p>Приглашений нет</p></div> :
                                teamInvites.map(invite => (
                                    <div key={`invite${invite.id}`} className={classes.card}>
                                        <div>
                                            <p>{invite.teamName} {getStatusText(invite.status)}</p>
                                        </div>

                                        <div className={classes.cardBody}>
                                            <p className={classes.info}>
                                                Получено: {safeFormatDate(invite.createdAt)}
                                            </p>

                                            {invite.status === 0 && (
                                                <div className={classes.publish_section}>
                                                    <Button
                                                        onClick={() => handleReject(invite.id)}
                                                        variant="secondary"
                                                        size={"sm"}
                                                        loading={rejectLoading}
                                                    >
                                                        Отклонить
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleAccept(invite.id)}
                                                        variant="primary"
                                                        size={"sm"}
                                                        loading={acceptLoading}
                                                    >
                                                        Принять
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            }
                        <PageLabel size={'h3'}>Создание команды</PageLabel>
                        <div className={classes.info_block}>

                            <Input
                                label="Название команды"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                name="name"
                                placeholder="Введите название команды"
                                required
                                error={formErrors.name}
                            />
                            <div className={classes.publish_section}>
                                <Button
                                    onClick={handleCreateClick}
                                    loading={createLoading}
                                >
                                    Создать команду
                                </Button>
                            </div>
                            <Modal
                                isOpen={isPublishModalOpen}
                                title={"Подтверждение создание команды"}
                                confirmText={"Подтверждаю"}
                                rejectText={"Отмена"}
                                onConfirm={confirmCreate}
                                onReject={() => setIsPublishModalOpen(false)}
                            >
                                <p>Подтвердите введенные данные.</p>
                            </Modal>
                        </div>
                        </>
                        :
                        <div>
                            <PageLabel size={'h3'}>{`Команда ${team.name}`}</PageLabel>
                            {team.participants.length > 0 && (
                                <>
                                    {team.participants.map((part) => (
                                        <div key={`participants_${part.id}`}>
                                            <TeamParticipantItem
                                                hackathonId={hackathonId}
                                                participant={part}
                                                searchTeam={searchTeam}
                                                teamRole={team.teamRole}
                                            />
                                        </div>
                                    ))}
                                    {team.teamRole == 2 ?
                                            <Button
                                            variant={"danger"}
                                            size={"sm"}
                                            loading={isDisbandLoading}
                                            onClick={() => setIsDisbandModalOpen(true)}
                                        >
                                            Расформировать команду
                                        </Button>
                                        :
                                        <Button
                                            variant={"danger"}
                                            size={"sm"}
                                            loading={isLeaveLoading}
                                            onClick={() => setIsLeaveModalOpen(true)}
                                        >
                                            Выйти из команды
                                        </Button>
                                    }

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
                                    <Modal
                                        isOpen={isLeaveModalOpen}
                                        rejectText={"Отмена"}
                                        confirmText={"Подтверждаю"}
                                        title={"Подтверждение действия"}
                                        onReject={() => setIsLeaveModalOpen(false)}
                                        onConfirm={handleLeave}
                                    >
                                        <p>Подтвердите выход из команды</p>
                                    </Modal>
                                </>
                            )}
                        </div>
                    }
                </>
            }

            {loadingError && <Error>{loadingError}</Error>}
            {createError && <Error>{createError}</Error>}
        </div>
    );
}


export default TeamSection