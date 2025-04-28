import React, {useEffect, useState} from 'react';
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
import DatePicker from "../../components/datePicker/DatePicker.tsx";
import Button from "../../components/button/Button.tsx";
import Modal from "../../components/modal/Modal.tsx";
import {Option} from "../organozaton/types.ts";
import Select from "../../components/select/Select.tsx";
import {OrganizationAPI} from "../organozaton/organizationAPI.ts";

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

const CreateHackathon: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        coverImage: null as string | null,
        regDateFrom: '',
        regDateTo: '',
        workDateFrom: '',
        workDateTo: '',
        evalDateFrom: '',
        evalDateTo: '',
        minTeamSize: 1,
        maxTeamSize: 5,
        organizationId: 0,
        goals: [''],
        stages: [] as Stage[],
        criteria: [] as Criteria[],
        technologies: [] as string[],
        prizes: [] as Prize[],
        sponsors: [] as Sponsor[],

    });

    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [myOrganizations, setMyOrganization] = useState<Option[]>([])
    const [isMyOrganizationsLoading, setIsMyOrganizationsLoading] = useState<boolean>(true)
    const [myOrganizationsError, setIsMyOrganizationsError] = useState<string | null>(null)

    useEffect(() => {
        setIsMyOrganizationsLoading(true)
        setIsMyOrganizationsError(null)
        OrganizationAPI.getMyOptions()
            .then((res) => {
                setMyOrganization(res)
            })
            .catch(() => {
                setIsMyOrganizationsError("Ошибка при получении организаций")
            })
            .finally( () => {
                setIsMyOrganizationsLoading(false)
            })
    }, []);

    const handlePublishClick = () => {
            setIsPublishModalOpen(true);
    };


    const confirmPublish = () => {
        // Здесь логика публикации
        console.log('Хакатон опубликован:', formData);
        setIsPublishModalOpen(false);
        // Можно добавить редирект или уведомление об успехе
    };

    const handleOrganizationChange = (n : number) => {
        setFormData(prev => ({
            ...prev,
            organizationId: n
        }));
    }

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
                        value={formData.regDateFrom}
                        onChange={(value) => handleDateChange('regDateFrom', value)}
                        maxDate={formData.regDateTo || formData.workDateFrom || formData.workDateTo || formData.evalDateFrom || formData.evalDateTo}
                    />
                    <DatePicker
                        label="Окончание регистрации"
                        value={formData.regDateTo}
                        onChange={(value) => handleDateChange('regDateTo', value)}
                        minDate={formData.regDateFrom}
                        maxDate={formData.workDateFrom || formData.workDateTo || formData.evalDateFrom || formData.evalDateTo}
                    />
                    <DatePicker
                        label="Начало работы"
                        value={formData.workDateFrom}
                        onChange={(value) => handleDateChange('workDateFrom', value)}
                        minDate={formData.regDateTo || formData.regDateFrom}
                        maxDate={formData.workDateTo || formData.evalDateFrom || formData.evalDateTo}
                    />
                    <DatePicker
                        label="Окончание работы"
                        value={formData.workDateTo}
                        onChange={(value) => handleDateChange('workDateTo', value)}
                        minDate={formData.workDateFrom || formData.regDateTo || formData.regDateFrom}
                        maxDate={formData.evalDateFrom || formData.evalDateTo}
                    />
                    <DatePicker
                        label="Начало оценки"
                        value={formData.evalDateFrom}
                        onChange={(value) => handleDateChange('evalDateFrom', value)}
                        minDate={formData.workDateTo || formData.workDateFrom || formData.regDateTo || formData.regDateFrom}
                        maxDate={formData.evalDateTo}
                    />
                    <DatePicker
                        label="Окончание оценки"
                        value={formData.evalDateTo}
                        onChange={(value) => handleDateChange('evalDateTo', value)}
                        minDate={formData.evalDateFrom || formData.workDateTo || formData.workDateFrom || formData.regDateTo || formData.regDateFrom}
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

            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Выбор организации</h4>
                <Select
                    label="Выбирите организацию"
                    value={formData.organizationId}
                    onChange={handleOrganizationChange}
                    placeholder={"Выбирите организацию"}
                    name="organizationId"
                    options={myOrganizations}
                    loading={isMyOrganizationsLoading}
                    error={myOrganizationsError}
                    horizontal
                />
            </div>

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

export default CreateHackathon;