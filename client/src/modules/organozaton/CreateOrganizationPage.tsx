import React, {FormEvent, useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import {OrganizationCreate, OrganizationCreateErrors} from "./types.ts";
import Button from '../../components/button/Button.tsx';
import Modal from '../../components/modal/Modal.tsx';
import Error from "../../components/error/Error.tsx";

const CreateOrganizationPage: React.FC = () => {
    const [formData, setFormData] = useState<OrganizationCreate>({
        legalName: "",
        shortLegalName: "",
        INN: "",
        OGRN: "",
        contactEmail: "",
        website: "",
    });
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)
    const [publishLoadnig, setPublishLoadin] = useState<boolean>(false)
    const [formErrors, setFormErrors] = useState<OrganizationCreateErrors>({
        legalName: "",
        shortLegalName: "",
        INN: "",
        OGRN: "",
        contactEmail: "",
        website: ""
    });
    const [publishError, setPublishError] = useState<null | string>(null)


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) :
                type === 'checkbox' ? checked :
                    value
        }));
    };

    const confirmPublish = async (e: FormEvent) => {
        e.preventDefault();
        setIsPublishModalOpen(false)
        setPublishLoadin(true);
        setPublishError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setPublishError(null);
            setPublishLoadin(false);
            return;
        }

        try {
            // const result = await authAPI.login(formData);
            // localStorage.setItem('access_token', result.access_token);
            //
            // const userData = await authAPI.verify();
            // dispatch(loginSuccess(userData));
            // navigate('/');
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка входа";
            setPublishError(errorMessage);
        } finally {
            setPublishLoadin(false);
        }
    };

    const validateForm = () => {
        const errors: OrganizationCreateErrors = {};
        if (!formData.legalName) {
            errors.legalName = "Полное название не может быть пустым";
        }


        if (!formData.contactEmail) {
            errors.contactEmail = "Контактный email не может быть пустым";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.contactEmail)) {
                errors.contactEmail = "Email не верного формата";
            }
        }
        return errors;
    };


    const handlePublishClick = () => {
        if (validateForm()) {
            setIsPublishModalOpen(true);
        }
    };

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Создание организации</PageLabel>

            <div className={classes.text_info}>
                <Input
                    label="Полное название"
                    type="text"
                    value={formData.legalName}
                    onChange={handleChange}
                    name="name"
                    placeholder="Введите полное название"
                    required
                    error={formErrors.legalName}
                />
            </div>

            <div className={classes.text_info}>
                <Input
                    label="Коротное название"
                    type="text"
                    value={formData.legalName}
                    onChange={handleChange}
                    name="name"
                    placeholder="Введите полное название"
                />
            </div>

            <div className={classes.text_info}>
                <Input
                    label="ИНН"
                    type="text"
                    value={formData.INN}
                    onChange={handleChange}
                    name="INN"
                    placeholder="Введите ИНН"
                    required
                />
            </div>

            <div className={classes.text_info}>
                <Input
                    label="ОГРН"
                    type="text"
                    value={formData.OGRN}
                    onChange={handleChange}
                    name="OGRN"
                    placeholder="Введите ОГРН"
                    required
                />
            </div>

            <div className={classes.text_info}>
                <Input
                    label="Контактный email"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    name="contactEmail"
                    placeholder="Введите контактный email"
                    required
                />
            </div>

            <div className={classes.text_info}>
                <Input
                    label="Вебсайт"
                    type="text"
                    value={formData.website}
                    onChange={handleChange}
                    name="website"
                    placeholder="Введите ссылку"
                    required
                />
            </div>

            <div className={classes.publish_section}>
                <Button
                    onClick={handlePublishClick}
                    loading={publishLoadnig}
                >
                    Опубликовать хакатон
                </Button>
            </div>

            {publishError && <Error>{publishError}</Error>}


            {/* Модальное окно подтверждения */}
            <Modal
                isOpen={isPublishModalOpen}
                title={"Подтверждение создание организации"}
                text={"Проверьте все данные. Позже модератор будет проверять ваши данные."}
                confirmText={"Подтверждаю"}
                rejectText={"Отмена"}
                onConfirm={confirmPublish}
                onReject={() => setIsPublishModalOpen(false)}
            />
        </div>
    );
};

export default CreateOrganizationPage;