import {TeamCreate, TeamData} from "../types.ts";
import React, {useEffect, useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";
import {useParams} from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import classes from  "../hackathon.module.css"
import Error from "../../../components/error/Error.tsx";
import Input from "../../../components/input/Input.tsx";
import Modal from "../../../components/modal/Modal.tsx";
import Button from "../../../components/button/Button.tsx";

const TeamSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;
    const [isCreate, setIsCreate] = useState<boolean>(false)
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)

    const [formData, setFormData] = useState<TeamCreate>({
        name: ""
    })

    const [formErrors, setFormErrors] = useState<{name?: string}>({
        name: ""
    });

    const [team, setTeam] = useState<TeamData>({
        name: "",
        participants: []
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
                if (!data.name) {
                    setIsCreate(true)
                } else {
                    setTeam(data);
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
            return;
        }

        try {
            // await OrganizationAPI.create(formData);
            // navigate('/organizations/my');
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при создании организации";
            setCreateError(errorMessage);
        } finally {
            setCreateLoading(false);
        }
    };


    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>{isCreate ? "Создание команды" : `Команда${ team.name}`}</PageLabel>
            {isCreate ?
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
                </div>:
                <div></div>}



            {/*{searchLoading ? <Loader/> :*/}
            {/*    participants.list?.length > 0 ? (*/}
            {/*        participants.list.map((part) => (*/}
            {/*            <div key={`participants_${part.id}`}>*/}
            {/*                <ParticipantItem participant={part}/>*/}
            {/*            </div>*/}
            {/*        ))*/}
            {/*    ) : (*/}
            {/*        <div className={classes.noResults}><p>Участники не найдены</p></div>*/}
            {/*    )*/}
            {/*}*/}
            {loadingError && <Error>{loadingError}</Error>}
            {createError && <Error>{createError}</Error>}
        </div>
    );
}


export default TeamSection