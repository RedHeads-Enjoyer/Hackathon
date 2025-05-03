import React, {useState} from 'react';
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
import SelectSearch from "../../components/searchSelect/SearchSelect.tsx";
import {Link} from "react-router-dom";
import {Option} from "../organozaton/types.ts";
import FileUpload from "../../components/fileUpload/FileUpload.tsx";

interface Criteria {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
}

interface Award {
    id: string;
    placeFrom: number;
    placeTo: number;
    moneyAmount: number,
    additionally: string;
}

interface HackathonFormData {
    name: string;
    description: string;
    coverImage: string | null;
    regDateFrom: string;
    regDateTo: string;
    workDateFrom: string;
    workDateTo: string;
    evalDateFrom: string;
    evalDateTo: string;
    minTeamSize: number;
    maxTeamSize: number;
    organizationId: number;
    goals: string[];
    stages: Stage[];
    criteria: Criteria[];
    technologies: Option[];
    awards: Award[];
    documents: File[]; // Added documents field
}

interface HackathonFormErrors {
    name?: string | undefined,
    description?: string | undefined,
    organizationId?: string | undefined,
}

const CreateHackathon: React.FC = () => {
    const [formData, setFormData] = useState<HackathonFormData>({
        name: '',
        description: '',
        coverImage: null,
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
        stages: [],
        criteria: [],
        technologies: [],
        awards: [],
        documents: [],
    });

    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [documentError, setDocumentError] = useState<string | null>(null);

    const handlePublishClick = () => {
        setIsPublishModalOpen(true);
    };

    const [formErrors, setFormErrors] = useState<HackathonFormErrors>({});

    const validateForm = () => {
        const errors: HackathonFormErrors = {};
        if (!formData.name) {
            errors.name = "Название хакатона не может быть пустым";
        }

        if (!formData.description) {
            errors.description = "Описание хакатона не может быть пустым";
        }

        if (formData.organizationId == 0) {
            errors.organizationId = "Организация не может быть пустой";
        }
        return errors;
    };

    const confirmPublish = () => {
        setIsPublishModalOpen(false);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            return;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const {name, value, type} = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) :
                type === 'checkbox' ? checked :
                    value
        }));

        setFormErrors(prev => ({
            ...prev,
            [name]: undefined
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

    const handleAwardsChange = (awards: Award[]) => {
        setFormData(prev => ({
            ...prev,
            awards
        }));
    };

    const handleStagesChange = (stages: Stage[]) => {
        setFormData(prev => ({
            ...prev,
            stages
        }));
    };

    const handleOrganizationIdChange  = (option: Option) => {
        setFormData(prev => ({
            ...prev,
            organizationId: option.value
        }))

        setFormErrors(prev => ({
            ...prev,
            organizationId: undefined
        }));
    }

    // Handler for file uploads
    const handleFilesChange = (files: File[]) => {
        setFormData(prev => ({
            ...prev,
            documents: files
        }));

        // Clear any error when files are uploaded
        if (files.length > 0) {
            setDocumentError(null);
        }
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
                            required
                            error={formErrors.name}
                        />
                        <TextArea
                            label="Описание хакатона"
                            value={formData.description}
                            onChange={handleChange}
                            name="description"
                            placeholder="Опишите ваш хакатон"
                            minRows={4}
                            required
                            error={formErrors.description}
                        />

                        <SelectSearch
                            label={"Выберите организацию"}
                            url={"organizations/my/options"}
                            onChange={handleOrganizationIdChange}
                            notFound={<p>Подтвержденная организация с таким названием не найдена. <Link to={"/organization/create"}>Создать организацию</Link></p>}
                            placeholder={"Введите название"}
                            required
                            error={formErrors.organizationId}
                        />
                    </div>
                    <div className={classes.image_info}>
                        <ImageUploader
                            onImageChange={handleImageCrop}
                            initialImage={formData.coverImage}
                            required
                            error={'asd'}
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
                        max={formData.maxTeamSize}
                        required
                    />
                    <Input
                        label="Максимальный размер команды"
                        type="number"
                        value={formData.maxTeamSize}
                        onChange={handleChange}
                        name="maxTeamSize"
                        min={formData.minTeamSize}
                        max={20}
                        required
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
                initialAwards={formData.awards}
                onChange={handleAwardsChange}
            />

            {/* Блок документов */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Документация хакатона</h4>
                <FileUpload
                    label="Документы проекта"
                    required
                    value={formData.documents}
                    onChange={handleFilesChange}
                    acceptedFileTypes=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    maxFileSize={5 * 1024 * 1024} // 5MB
                    maxFiles={5}
                    placeholder="Перетащите файлы сюда или нажмите для выбора"
                />
                <div className={classes.file_help}>
                    <p>Загрузите важные документы: положение о проведении, правила участия, требования к проектам и т.д.</p>
                </div>
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
                onConfirm={confirmPublish}
                onReject={() => setIsPublishModalOpen(false)}
                title="Подтверждение публикации"
                confirmText="Подтвердить"
                rejectText="Отмена"
            >
                <p className={classes.modalText}>
                    Вы уверены, что хотите опубликовать хакатон? После публикации изменить некоторые данные будет невозможно.
                </p>
            </Modal>
        </div>
    );
};

export default CreateHackathon;