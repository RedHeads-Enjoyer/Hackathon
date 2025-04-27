import React, { useState } from 'react';
import classes from '../style.module.css';
import {Technology, TechnologyFormError, TechnologyUpdate} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import Input from "../../../components/input/Input.tsx";
import Error from "../../../components/error/Error.tsx";
import Modal from "../../../components/modal/Modal.tsx";
import {technologyAPI} from "../technologyAPI.ts";
import TextArea from "../../../components/textArea/TextArea.tsx";

type TechnologyCardProps = {
    technology: Technology;
    handleUpdate: () => void;
};

const TechnologyItem= ({technology, handleUpdate}: TechnologyCardProps) => {
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
    const [isUpdate, setIsUpdate] = useState<boolean>(false)
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [formData, setFormData] = useState<TechnologyUpdate>({
        name: technology.name,
        description: technology.description,
    });
    const [formErrors, setFormErrors] = useState<TechnologyFormError>({
        name: "",
        description: "",
    });
    const [updateError, setUpdateError] = useState<null | string>(null)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => {
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
        const errors: TechnologyFormError = {};
        if (!formData.name) {
            errors.name = "Название не может быть пустым";
        }

        if (!formData.description) {
            errors.description = "описание не может быть пустым";
        }

        return errors;
    };

    const handleRejectClick = () => {
        setIsUpdate(false)
        setFormData({
            name: technology.name,
            description: technology.description,
        })
    }

    const confirmDelete = async () => {
        setIsDeleteModalOpen(false)
        setDeleteLoading(true);
        setUpdateError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setUpdateError(null);
            setDeleteLoading(false);
            return;
        }

        try {
            await technologyAPI.delete(technology.ID);
            setIsUpdate(false)
            handleUpdate()
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при удалении технологии";
            setUpdateError(errorMessage);
        } finally {
            setDeleteLoading(false);
        }
    }

    const confirmUpdate = async () => {
        setIsUpdateModalOpen(false)
        setUpdateLoading(true);
        setUpdateError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setUpdateError(null);
            setUpdateLoading(false);
            return;
        }

        try {
            await technologyAPI.update(technology.ID, formData);
            setIsUpdate(false)
            handleUpdate()
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при изменении технологии";
            setUpdateError(errorMessage);
        } finally {
            setUpdateLoading(false);
        }
    };


    return (
        <div className={classes.card}>
            {!isUpdate ?
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
                        <TextArea
                            label="Описание"
                            value={formData.description}
                            onChange={handleChange}
                            name="description"
                            placeholder="Введите описание"
                            required
                            error={formErrors.description}
                        />
                    </div>

                    <div className={classes.update_section}>
                        <Button
                            onClick={() => setIsDeleteModalOpen(true)}
                            loading={deleteLoading}
                            variant={"ghost"}
                        >Удалить
                        </Button>
                        <Button
                            onClick={handleRejectClick}
                            variant={"ghost"}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={() => setIsUpdateModalOpen(true)}
                            loading={updateLoading}
                        >
                            Изменить
                        </Button>
                    </div>

                    {updateError && <Error>{updateError}</Error>}

                    <Modal
                        isOpen={isUpdateModalOpen}
                        title={"Подтверждение действие"}
                        confirmText={"Подтверждаю"}
                        rejectText={"Отмена"}
                        onConfirm={confirmUpdate}
                        onReject={() => setIsUpdateModalOpen(false)}
                    >
                        <p>Подтвердите изменение технологии</p>
                    </Modal>

                    <Modal
                        isOpen={isDeleteModalOpen}
                        title={"Подтверждение действие"}
                        confirmText={"Подтверждаю"}
                        rejectText={"Отмена"}
                        onConfirm={confirmDelete}
                        onReject={() => setIsDeleteModalOpen(false)}
                    >
                        <p>Подтвердите удаление технологии</p>
                    </Modal>
                </>
            }

        </div>
    );
};

export default TechnologyItem;