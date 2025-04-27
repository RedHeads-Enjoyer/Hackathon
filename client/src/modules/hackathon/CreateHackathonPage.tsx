import React, { useState } from 'react';
import classes from './hackathon.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import TextArea from "../../components/textArea/TextArea.tsx";
import ImageUploader from "../../components/imageUploader/ImageUploader.tsx";
import StepsListWithDates from "../../components/stepsListWithDates/StepsListWithDates.tsx";
import {Stage} from "../../components/stepsListWithDates/types.ts";
import TechnologyStackInput from "../../components/technologyStackInput/TechnologyStackInput.tsx";
import CriteriaEditor from "../../components/criteriaEditor/CriteriaEditor.tsx";
import AwardsEditor from "../../components/awardsEditor/AwardsEditor.tsx";
import SponsorsEditor from "../../components/sponsorsEditor/SponsorsEditor.tsx";
import DatePicker from "../../components/datePicker/DatePicker.tsx";
import Error from "../../components/error/Error.tsx";
import Button from "../../components/button/Button.tsx";
import Modal from "../../components/modal/Modal.tsx";

interface Criteria {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
}

interface Prize {
    id: string;
    placeFrom: number;
    placeTo: number;
    description: string;
}

interface Sponsor {
    id: string;
    name: string;
    url: string;
}

const CreateHackathonPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        coverImage: null as string | null,
        registrationStart: '',
        registrationEnd: '',
        hackathonStart: '',
        goals: [''], //
        stages: [] as Stage[], //
        criteria: [] as Criteria[],
        technologies: [] as string[], //
        prizes: [] as Prize[], //
        sponsors: [] as Sponsor[], //
        minTeamSize: 1,
        maxTeamSize: 5,
    });

    const [errors, setErrors] = useState<string[]>([]);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

    const validateForm = () => {
        const newErrors: string[] = [];

        // Основная информация
        if (!formData.name.trim()) newErrors.push('Введите название хакатона');
        if (!formData.description.trim()) newErrors.push('Введите описание хакатона');
        if (!formData.coverImage) newErrors.push('Загрузите обложку хакатона');

        // Даты
        if (!formData.registrationStart) newErrors.push('Укажите начало регистрации');
        if (!formData.registrationEnd) newErrors.push('Укажите окончание регистрации');
        if (!formData.hackathonStart) newErrors.push('Укажите начало хакатона');

        // Размер команды
        if (!formData.minTeamSize || formData.minTeamSize <= 0) newErrors.push('Укажите минимальный размер команды');
        if (!formData.maxTeamSize || formData.maxTeamSize <= 0) newErrors.push('Укажите максимальный размер команды');
        if (formData.minTeamSize >= formData.maxTeamSize) newErrors.push('Минимальный размер должен быть меньше максимального');

        // Этапы хакатона
        if (formData.stages.length === 0) {
            newErrors.push('Добавьте хотя бы один этап хакатона');
        } else {
            formData.stages.forEach((stage, index) => {
                if (!stage.name.trim()) newErrors.push(`Укажите название этапа #${index + 1}`);
                if (!stage.description.trim()) newErrors.push(`Введите описание этапа #${index + 1}`);
                if (!stage.startDate) newErrors.push(`Укажите дату начала этапа #${index + 1}`);
                if (!stage.endDate) newErrors.push(`Укажите дату окончания этапа #${index + 1}`);
            });
        }

        // Критерии оценки
        if (formData.criteria.length === 0) newErrors.push('Добавьте хотя бы один критерий оценки');

        // Технологии
        if (formData.technologies.length === 0) newErrors.push('Добавьте хотя бы одну технологию');

        // Награды
        if (formData.prizes.length === 0) newErrors.push('Добавьте хотя бы одну награду');

        // Спонсоры
        if (formData.sponsors.length === 0) newErrors.push('Добавьте хотя бы одного спонсора');

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handlePublishClick = () => {
        if (validateForm()) {
            setIsPublishModalOpen(true);
        }
    };

    const renderErrors = () => {
        if (errors.length === 0) return null;

        return (
            <Error>
                <div className={classes.error_title}>Необходимо исправить следующие ошибки:</div>
                <ul className={classes.error_list}>
                    {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                    ))}
                </ul>
            </Error>
        );
    };


    const confirmPublish = () => {
        // Здесь логика публикации
        console.log('Хакатон опубликован:', formData);
        setIsPublishModalOpen(false);
        // Можно добавить редирект или уведомление об успехе
    };

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

    const handleDateChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCriteriaChange = (criteria: Criteria[]) => {
        setFormData(prev => ({
            ...prev,
            criteria
        }));
    };

    const handleImageCrop = (croppedImage: string) => {
        setFormData(prev => ({
            ...prev,
            croppedImage,
            coverImage: croppedImage
        }));
    };

    const handlePrizesChange = (prizes: Prize[]) => {
        setFormData(prev => ({
            ...prev,
            prizes
        }));
    };

    const handleSponsorsChange = (sponsors: Sponsor[]) => {
        setFormData(prev => ({
            ...prev,
            sponsors
        }));
    };

    const handleStagesChange = (stages: Stage[]) => {
        setFormData(prev => ({
            ...prev,
            stages
        }));
    };

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Создание хакатона</PageLabel>

            {/* Блок 1: Основные данные */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Основные данные</h4>
                <div className={classes.basic_info_grid}>
                    <div className={classes.text_info}>
                        <Input
                            label="Название хакатона"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            name="name"
                            placeholder="Введите название"
                        />
                        <TextArea
                            label="Описание хакатона"
                            value={formData.description}
                            onChange={handleChange}
                            name="description"
                            placeholder="Опишите ваш хакатон"
                            minRows={4}
                        />
                    </div>
                    <div className={classes.image_info}>
                        <ImageUploader
                            onImageChange={handleImageCrop}
                            initialImage={formData.coverImage}
                        />
                    </div>
                </div>
            </div>

            {/* Блок 2: Даты */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Даты проведения</h4>
                <div className={classes.dates_grid}>
                    <DatePicker
                        label="Начало регистрации"
                        value={formData.registrationStart}
                        onChange={(value) => handleDateChange('registrationStart', value)}
                    />
                    <DatePicker
                        label="Окончание регистрации"
                        value={formData.registrationEnd}
                        onChange={(value) => handleDateChange('registrationEnd', value)}
                        minDate={formData.registrationStart}
                    />
                    <DatePicker
                        label="Начало хакатона"
                        value={formData.hackathonStart}
                        onChange={(value) => handleDateChange('hackathonStart', value)}
                        minDate={formData.registrationEnd}
                    />
                </div>
            </div>

            {/* Блок 3: Размер команд */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Размер команд</h4>
                <div className={classes.team_size_grid}>
                    <Input
                        label="Минимальный размер команды"
                        type="number"
                        value={formData.minTeamSize}
                        onChange={handleChange}
                        name="minTeamSize"
                        min={1}
                        max={formData.maxTeamSize - 1}
                    />
                    <Input
                        label="Максимальный размер команды"
                        type="number"
                        value={formData.maxTeamSize}
                        onChange={handleChange}
                        name="maxTeamSize"
                        min={formData.minTeamSize + 1}
                        max={20}
                    />
                </div>
            </div>

            {/* Остальные секции */}
            <StepsListWithDates
                initialStages={formData.stages}
                onChange={handleStagesChange}
            />

            <CriteriaEditor
                initialCriteria={formData.criteria}
                onChange={handleCriteriaChange}
            />

            <TechnologyStackInput
                initialTechnologies={formData.technologies}
                onChange={(techs) => setFormData({...formData, technologies: techs})}
            />

            <AwardsEditor
                initialAwards={formData.prizes}
                onChange={handlePrizesChange}
            />

            <SponsorsEditor
                initialSponsors={formData.sponsors}
                onChange={handleSponsorsChange}
            />

            {renderErrors()}

            {/* Кнопка публикации */}
            <div className={classes.publish_section}>
                <Button
                    onClick={handlePublishClick}
                >
                    Опубликовать хакатон
                </Button>
            </div>

            {/* Модальное окно подтверждения */}
            <Modal
                isOpen={isPublishModalOpen}
                title={"Подтверждение публикации"}
                text={"Вы уверены, что хотите опубликовать хакатон? После публикации изменить некоторые данные будет невозможно."}
                onReject={() => setIsPublishModalOpen(false)}
                onConfirm={confirmPublish}
                rejectText={"Отмена"}
                confirmText={"Подтвердить"}
            />

        </div>
    );
};

export default CreateHackathonPage;