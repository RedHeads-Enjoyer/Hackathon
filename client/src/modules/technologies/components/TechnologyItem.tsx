import React, { useState } from 'react';
import classes from '../style.module.css';
import {Technology, TechnologyCreate, TechnologyFormError} from '../types.ts';
import Notification, {NotificationProps} from "../../../components/notification/notification.tsx";
import Button from "../../../components/button/Button.tsx";
import Input from "../../../components/input/Input.tsx";
import Error from "../../../components/error/Error.tsx";
import Modal from "../../../components/modal/Modal.tsx";
import {technologyAPI} from "../technologyAPI.ts";

type OrganizationCardProps = {
    technology: Technology;
};

const TechnologyItem: React.FC<OrganizationCardProps> = ({technology}) => {
    //
    // const [technology, setOrganization] = useState<Organization>(props.organization);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)
    const [initialTechnology, setInitialTechnology] = useState<Technology>(technology)
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [isUpdate, setIsUpdate] = useState<boolean>(false)
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState<TechnologyCreate>({
        name: "",
        description: "",
    });
    const [formErrors, setFormErrors] = useState<TechnologyFormError>({
        name: "",
        description: "",
    });
    const [updateError, setUpdateError] = useState<null | string>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Сброс ошибок при вводе
        setFormErrors(prev => ({
            ...prev,
            [name]: undefined
        }));
    };

    const validateForm = () => {
        const errors: TechnologyFormError = {};
        if (!formData.name) {
            errors.name = "Название не может быть пустым";
        }

        if (!formData.description) {
            errors.description = "описание не может быть пустым";
        }

        return errors;
    };

    const handlePublishClick = () => {
        setIsPublishModalOpen(true);
    };

    const confirmUpdate = async () => {
        setIsPublishModalOpen(false)
        setUpdateLoading(true);
        setUpdateError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setUpdateLoading(null);
            setUpdateLoading(false);
            return;
        }

        try {
            await technologyAPI.create(formData);
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при создании технологии";
            setPublishError(errorMessage);
        } finally {
            setPublishLoading(false);
        }
    };

    // const handleStatusChange = (n: number) => {
    //     setChangeStatusLoading(true);
    //     OrganizationAPI.setStatus(props.organization.ID, n)
    //         .then(() => {
    //             setOrganization(prevState => ({
    //                 ...prevState,
    //                 status: n
    //             }));
    //             setChangeStatusLoading(false);
    //             setNotification({
    //                 message: 'Статус успешно изменен',
    //                 type: 'success'
    //             });
    //         })
    //         .catch((error) => {
    //             setChangeStatusLoading(false);
    //             setNotification({
    //                 message: 'Ошибка при изменении статуса',
    //                 type: 'error'
    //             });
    //             console.error(error);
    //         })
    //         .finally(() => {
    //             setChangeStatusLoading(false)
    //         })
    // };

    const handleNotificationClose = () => {
        setNotification(null);
    };

    return (
        <div className={classes.card}>
            {isUpdate == false ?
            <>
                <div className={classes.cardUpdate}>
                    <h3 className={classes.title}>{technology.name}</h3>
                    <Button
                        onClick={() => setIsUpdate(true)}
                        variant={"secondary"}
                        size={"sm"}
                    > Изменить </Button>
                </div>

                <p className={classes.info}>{technology.description}</p>

                {notification && (
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        duration={1500}
                        onClose={handleNotificationClose}
                    />
                )}
            </> :
                <>
                    <div className={classes.text_info}>
                        <Input
                            label="Название"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            name="name"
                            placeholder="Введите название"
                            required
                            error={formErrors.name}
                        />
                    </div>

                    <div className={classes.text_info}>
                        <Input
                            label="Описание"
                            type="text"
                            value={formData.description}
                            onChange={handleChange}
                            name="description"
                            placeholder="Введите описание"
                            required
                            error={formErrors.description}
                        />
                    </div>

                    <div className={classes.publish_section}>
                        <Button
                            onClick={handlePublishClick}
                            loading={updateLoading}
                        >
                            Создать технологию
                        </Button>
                    </div>

                    {updateError && <Error>{updateError}</Error>}

                    <Modal
                        isOpen={isPublishModalOpen}
                        title={"Подтверждение действие"}
                        confirmText={"Подтверждаю"}
                        rejectText={"Отмена"}
                        onConfirm={confirmPublish}
                        onReject={() => setIsPublishModalOpen(false)}
                    >
                        <p>Подтвердите создание технологии</p>
                    </Modal>
                </>
            }

        </div>
    );
};

export default TechnologyItem;