import React, {useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import {OrganizationCreate, OrganizationCreateErrors} from "./types.ts";
import Button from '../../components/button/Button.tsx';
import Modal from '../../components/modal/Modal.tsx';
import Error from "../../components/error/Error.tsx";
import {OrganizationAPI} from "./organizationAPI.ts";
import {useNavigate} from "react-router-dom";

const CreateOrganizationPage: React.FC = () => {
    const [formData, setFormData] = useState<OrganizationCreate>({
        legalName: "",
        INN: "",
        OGRN: "",
        contactEmail: "",
        website: "",
    });
    const [isPublishModalOpen, setIsPublishModalOpen] = useState<boolean>(false)
    const [publishLoadnig, setPublishLoadin] = useState<boolean>(false)
    const [formErrors, setFormErrors] = useState<OrganizationCreateErrors>({
        legalName: "",
        INN: "",
        OGRN: "",
        contactEmail: "",
        website: ""
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
            await OrganizationAPI.create(formData);
            navigate('/organization/my');
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при создании организации";
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

        if (!formData.INN) {
            errors.INN = "ИНН не может быть пустым";
        } else if(formData.INN.length != 12 && formData.INN.length != 10) {
            errors.INN = "Длина ИНН должна быть 10 или 12 символов";
        }

        if (!formData.OGRN) {
            errors.OGRN = "ОГРН не может быть пустым";
        } else if(formData.OGRN.length != 13 && formData.OGRN.length != 15) {
            errors.OGRN = "Длина ОГРН должна быть 13 или 15 символов";
        }

        if (!formData.contactEmail) {
            errors.contactEmail = "Контактный email не может быть пустым";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.contactEmail)) {
                errors.contactEmail = "Не корректный Email";
            }
        }

        if (!formData.website) {
            errors.website = "Вебсайт не может быть пустым";
        } else {
            const baseUrlRegex = /^((http|https|ftp):\/\/)?(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)/i;
            if (!baseUrlRegex.test(formData.website)) {
                errors.website = "Не корректный вебсайт";
            }
        }
        return errors;
    };


    const handlePublishClick = () => {
        setIsPublishModalOpen(true);
    };

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Создание организации</PageLabel>

            <div className={classes.info_block}>
                <div className={classes.text_info}>
                    <Input
                        label="Полное название"
                        type="text"
                        value={formData.legalName}
                        onChange={handleChange}
                        name="legalName"
                        placeholder="Введите полное название"
                        maxLength={200}
                        required
                        error={formErrors.legalName}
                    />
                </div>

                <div className={classes.text_info}>
                    <Input
                        label="ИНН"
                        type="textNumber"
                        value={formData.INN}
                        onChange={handleChange}
                        name="INN"
                        placeholder="Введите ИНН"
                        maxLength={12}
                        required
                        error={formErrors.INN}
                    />
                </div>

                <div className={classes.text_info}>
                    <Input
                        label="ОГРН"
                        type="textNumber"
                        value={formData.OGRN}
                        onChange={handleChange}
                        name="OGRN"
                        placeholder="Введите ОГРН"
                        maxLength={15}
                        required
                        error={formErrors.OGRN}
                    />
                </div>

                <div className={classes.text_info}>
                    <Input
                        label="Контактный email"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        name="contactEmail"
                        maxLength={100}
                        placeholder="Введите контактный email"
                        required
                        error={formErrors.contactEmail}
                    />
                </div>

                <div className={classes.text_info}>
                    <Input
                        label="Вебсайт"
                        type="text"
                        value={formData.website}
                        onChange={handleChange}
                        name="website"
                        maxLength={100}
                        placeholder="Введите ссылку"
                        required
                        error={formErrors.website}
                    />
                </div>

                <div className={classes.publish_section}>
                    <Button
                        onClick={handlePublishClick}
                        loading={publishLoadnig}
                    >
                        Создать организацию
                    </Button>
                </div>

                {publishError && <Error>{publishError}</Error>}

                <Modal
                    isOpen={isPublishModalOpen}
                    title={"Подтверждение создание организации"}
                    confirmText={"Подтверждаю"}
                    rejectText={"Отмена"}
                    onConfirm={confirmPublish}
                    onReject={() => setIsPublishModalOpen(false)}
                >
                    <p>Проверьте все данные. Позже модератор будет проверять ваши данные.</p>
                </Modal>
            </div>


        </div>
    );
};

export default CreateOrganizationPage;