import React, {useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import {TechnologyCreate, TechnologyFormError} from "./types.ts";
import Button from '../../components/button/Button.tsx';
import Modal from '../../components/modal/Modal.tsx';
import Error from "../../components/error/Error.tsx";
import {useNavigate} from "react-router-dom";
import {technologyAPI} from "./technologyAPI.ts";

const CreateTechnologyPage: React.FC = () => {
    const [formData, setFormData] = useState<TechnologyCreate>({
        name: "",
        description: "",
    });
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)
    const [publishLoading, setPublishLoading] = useState<boolean>(false)
    const [formErrors, setFormErrors] = useState<TechnologyFormError>({
        name: "",
        description: "",
    });

    const navigate = useNavigate()
    const [publishError, setPublishError] = useState<null | string>(null)


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

    const confirmPublish = async () => {
        setIsPublishModalOpen(false)
        setPublishLoading(true);
        setPublishError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setPublishError(null);
            setPublishLoading(false);
            return;
        }

        try {
            await technologyAPI.create(formData);
            navigate('/technologies');
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при создании технологии";
            setPublishError(errorMessage);
        } finally {
            setPublishLoading(false);
        }
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

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Создание технологии</PageLabel>

            <div className={classes.card}>

            <div className={classes.text_info}>
                <Input
                    label="Название"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    name="name"
                    maxLength={50}
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
                    maxLength={255}
                    error={formErrors.description}
                />
            </div>

            <div className={classes.publish_section}>
                <Button
                    onClick={handlePublishClick}
                    loading={publishLoading}
                >
                    Создать технологию
                </Button>
            </div>

            {publishError && <Error>{publishError}</Error>}
            </div>

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
        </div>
    );
};

export default CreateTechnologyPage;