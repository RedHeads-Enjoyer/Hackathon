import React, {useEffect, useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Error from "../../components/error/Error.tsx";
import Loader from "../../components/loader/Loader.tsx";
import {MentorInvite} from "./types.ts";
import {InviteApi} from "./inviteApi.ts";
import {Link} from "react-router-dom";
import Button from "../../components/button/Button.tsx";
import {safeFormatDate} from "../hackathon/OpenHackathon.tsx"; // Предполагаю, что у вас есть компонент Button

const MentorInvites: React.FC = () => {
    const initialMentorInvitesData: MentorInvite[] = []

    const [mentorInvites, setMentorInvites] = useState<MentorInvite[]>(initialMentorInvitesData);
    const [searchLoading, setSearchLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()

    const searchMentorInvites = () => {
        setSearchLoading(true)
        setSearchError(null);
        setMentorInvites(initialMentorInvitesData)
        InviteApi.getMentorInvites()
            .then((data) => {
                setMentorInvites(data);
                setSearchLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при поиске приглашений";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearchLoading(false);
        })
    }

    useEffect(() => {
        searchMentorInvites()
    }, []);

    useEffect(() => {
        console.log(mentorInvites)
    }, [mentorInvites]);

    const handleAccept = (inviteId: number) => {
        InviteApi.acceptMentorInvite(inviteId).then(() => searchMentorInvites())
    }

    const handleReject = (inviteId: number) => {
        InviteApi.rejectMentorInvite(inviteId).then(() => searchMentorInvites())
    }

    // Функция для получения текста статуса
    const getStatusText = (status: number) => {
        switch(status) {
            case 0: return "Ожидает ответа";
            case 1: return "Принято";
            case -1: return "Отклонено";
            default: return "Неизвестный статус";
        }
    }

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Приглашения стать ментором</PageLabel>

            {searchLoading ? <Loader/> : (
                <>
                    {mentorInvites?.length > 0 ? (
                        <div className={classes.invitesList}>
                            {mentorInvites.map((invite) => (
                                <div key={`invite${invite.id}`} className={classes.card}>
                                    <div className={classes.cardHeader}>
                                        <Link to={`/hackathon/${invite.hackathonId}`} className={classes.title}>
                                            {invite.hackathonName}
                                        </Link>
                                        <span className={`${classes.status} ${(invite.status)}`}>
                                            {getStatusText(invite.status)}
                                        </span>
                                    </div>

                                    <div className={classes.cardBody}>
                                        <p className={classes.info}>
                                            Получено: {safeFormatDate(invite.createdAt)}
                                        </p>

                                        {invite.status === 0 && (
                                            <div className={classes.actions}>
                                                <Button
                                                    onClick={() => handleReject(invite.id)}
                                                    variant="secondary"
                                                    size={"sm"}
                                                    className={classes.rejectButton}
                                                >
                                                    Отклонить
                                                </Button>
                                                <Button
                                                    onClick={() => handleAccept(invite.id)}
                                                    variant="primary"
                                                    size={"sm"}
                                                    className={classes.acceptButton}
                                                >
                                                    Принять
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={classes.info_block}>
                            <p className={classes.noResults}>У вас нет приглашений стать ментором</p>
                        </div>
                    )}
                </>
            )}

            {searchError && <Error>{searchError}</Error>}
        </div>
    );
};

export default MentorInvites;