import React, {useRef, useState} from 'react';
import classes from './hackathon.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import TextArea from "../../components/textArea/TextArea.tsx";
import ImageUploader from "../../components/imageUploader/ImageUploader.tsx";
import StepsListWithDates, {StepsListWithDatesRef} from "../../components/stepsListWithDates/StepsListWithDates.tsx";
import {Stage} from "../../components/stepsListWithDates/types.ts";
import TechnologyStackInput, {
    TechnologyStackInputRef
} from "../../components/technologyStackInput/TechnologyStackInput.tsx";
import CriteriaEditor, {CriteriaEditorRef} from "../../components/criteriaEditor/CriteriaEditor.tsx";
import AwardsEditor, {AwardsEditorRef} from "../../components/awardsEditor/AwardsEditor.tsx";
import DatePicker from "../../components/datePicker/DatePicker.tsx";
import Button from "../../components/button/Button.tsx";
import Modal from "../../components/modal/Modal.tsx";
import SelectSearch from "../../components/searchSelect/SearchSelect.tsx";
import {Link, useNavigate} from "react-router-dom";
import {Option} from "../organozaton/types.ts";
import FileUpload from "../../components/fileUpload/FileUpload.tsx";
import {Award, Criteria, HackathonFormData, HackathonFormErrors} from "./types.ts";
import Error from "../../components/error/Error.tsx";
import {HackathonAPI} from "./hackathonAPI.ts";
import MentorStackInput from "../../components/mentorStackInput/MentorStackInput.tsx";

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
        organizationId: 0,
        stages: [],
        criteria: [],
        technologies: [],
        awards: [],
        mentors: [],
        documents: [],
    });

    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const navigate = useNavigate()
    const [createHackathonLoading, setCreateHackathonLoading] = useState<boolean>(false)
    const [createHackathonError, setCreateHackathonError] = useState<string | null>(null)

    const stagesRef = useRef<StepsListWithDatesRef>(null);
    const criteriaRef = useRef<CriteriaEditorRef>(null);
    const techRef = useRef<TechnologyStackInputRef>(null);
    const awardsRef = useRef<AwardsEditorRef>(null);

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

        if (!formData.coverImage) {
            errors.coverImage = "Изображение не может быть пустым";
        }

        if (!formData.regDateFrom) {
            errors.regDateFrom = "Дата не может быть пустой";
        }

        if (!formData.regDateTo) {
            errors.regDateTo = "Дата не может быть пустой";
        }

        if (!formData.evalDateFrom) {
            errors.evalDateFrom = "Дата не может быть пустой";
        }

        if (!formData.evalDateTo) {
            errors.evalDateTo = "Дата не может быть пустой";
        }

        if (!formData.workDateFrom) {
            errors.workDateFrom = "Дата не может быть пустой";
        }

        if (!formData.workDateTo) {
            errors.workDateTo = "Дата не может быть пустой";
        }

        if (formData.stages.length === 0) {
            errors.stages = "Добавьте хотя бы один этап хакатона";
        }

        const stagesValid = stagesRef.current?.validate() ?? false;
        if (!stagesValid) {
            errors.stagesInvalid = true;
        }

        const criteriaValid = criteriaRef.current?.validate() ?? false;
        if (!criteriaValid) {
            errors.criteriaInvalid = true;
        }

        const techValid = techRef.current?.validate() ?? false;
        if (!techValid) {
            errors.technologiesInvalid = true;
        }

        const awardsValid = awardsRef.current?.validate() ?? false;
        if (!awardsValid) {
            errors.awardsInvalid = true;
        }

        if (formData.documents.length === 0) {
            errors.documents = "Загрузите хотя бы один документ";
        }

        return errors;
    };

    const confirmPublish = async () => {
        setIsPublishModalOpen(false);
        setCreateHackathonError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            // Устанавливаем общее сообщение об ошибке
            setCreateHackathonError("Пожалуйста, исправьте ошибки в форме перед публикацией хакатона");
            return;
        }

        setCreateHackathonLoading(true);

        HackathonAPI.create(formData).then((res) => {
            navigate(`/hackathon/${res}`)
        }).catch((err) => {
            const errorMessage = (err as Error).message || "Ошибка при создании хакатона";
            setCreateHackathonError(errorMessage);
        }).finally(() =>  setCreateHackathonLoading(false));
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

    const getOffsetDate = (regDateFrom: string, day: number): string | undefined  => {
        const date = new Date(regDateFrom);

        if (isNaN(date.getTime())) {
            return undefined;
        }

        date.setDate(date.getDate() + day);
        return date.toISOString().split('T')[0];
    }

    const handleDateChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        setFormErrors(prev => ({
            ...prev,
            [name]: undefined
        }));
    };

    const handleCriteriaChange = (criteria: Criteria[]) => {
        setFormData(prev => ({
            ...prev,
            criteria
        }));

        setFormErrors(prev => ({
            ...prev,
            criteriaInvalid: false
        }));
    };

    const handleImageCrop = (croppedImage: File) => {
        setFormData(prev => ({
            ...prev,
            coverImage: croppedImage
        }));

        setFormErrors(prev => ({
            ...prev,
            coverImage: undefined
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

    const handleTechnologyChange = (tech: Array<Option>) => {
        setFormData(prev => ({
            ...prev,
            technologies: tech
        }))
    }

    const handleMentorChange = (mentor: Array<Option>) => {
        setFormData(prev => ({
            ...prev,
            mentors: mentor
        }))
    }

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

    const handleFilesChange = (files: File[]) => {
        setFormData(prev => ({
            ...prev,
            documents: files
        }));

        // Очищаем ошибку при загрузке файлов
        setFormErrors(prev => ({
            ...prev,
            documents: undefined
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
                            required
                            error={formErrors.name}
                            maxLength={255}
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
                            maxLength={2000}
                        />

                        <SelectSearch
                            label={"Выберите организацию"}
                            url={"organization/my/options"}
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
                            error={formErrors.coverImage}
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
                        minDate={new Date().toISOString().split('T')[0]}
                        maxDate={getOffsetDate(formData.workDateFrom, -1)
                            || getOffsetDate(formData.evalDateFrom, -2)
                            || getOffsetDate(formData.evalDateTo, -3)}
                        error={formErrors.regDateFrom}
                        required
                    />
                    <DatePicker
                        label="Окончание регистрации"
                        value={formData.regDateTo}
                        onChange={(value) => {
                            handleDateChange('regDateTo', value);
                            handleDateChange('workDateFrom', value);
                        }}
                        minDate={getOffsetDate(formData.regDateFrom, 1)
                            || getOffsetDate(new Date().toISOString().split('T')[0], 1)}
                        maxDate={getOffsetDate(formData.evalDateFrom, -1)
                            || getOffsetDate(formData.evalDateTo, -2)}
                        error={formErrors.regDateTo}
                        required
                    />
                    <DatePicker
                        label="Начало работы"
                        value={formData.workDateFrom}
                        onChange={(value) => {
                            handleDateChange('workDateFrom', value);
                            handleDateChange('regDateTo', value);
                        }}
                        minDate={getOffsetDate(formData.regDateFrom, 1)
                            || getOffsetDate(new Date().toISOString().split('T')[0], 1)}
                        maxDate={getOffsetDate(formData.evalDateFrom, -1)
                            || getOffsetDate(formData.evalDateTo, -2)}
                        error={formErrors.workDateFrom}
                        required
                    />
                    <DatePicker
                        label="Окончание работы"
                        value={formData.workDateTo}
                        onChange={(value) => {
                            handleDateChange('workDateTo', value);
                            handleDateChange('evalDateFrom', value);
                        }}
                        minDate={getOffsetDate(formData.workDateFrom, 1)
                            || getOffsetDate(formData.regDateFrom, 2)
                            || getOffsetDate(new Date().toISOString().split('T')[0], 2)}
                        maxDate={getOffsetDate(formData.evalDateTo, -1)}
                        error={formErrors.workDateTo}
                        required
                    />
                    <DatePicker
                        label="Начало оценки"
                        value={formData.evalDateFrom}
                        onChange={(value) => {
                            handleDateChange('workDateTo', value);
                            handleDateChange('evalDateFrom', value);
                        }}
                        minDate={getOffsetDate(formData.workDateFrom, 1)
                            || getOffsetDate(formData.regDateFrom, 2)
                            || getOffsetDate(new Date().toISOString().split('T')[0], 2)}
                        maxDate={getOffsetDate(formData.evalDateTo, -1)}
                        error={formErrors.evalDateFrom}
                        required
                    />
                    <DatePicker
                        label="Окончание оценки"
                        value={formData.evalDateTo}
                        onChange={(value) => handleDateChange('evalDateTo', value)}
                        minDate={getOffsetDate(formData.evalDateFrom, 1)
                            || getOffsetDate(formData.workDateFrom, 2)
                            || getOffsetDate(formData.regDateFrom, 3)
                            || getOffsetDate(new Date().toISOString().split('T')[0], 3)}
                        error={formErrors.evalDateTo}
                        required
                    />
                </div>
                <p className={classes.help_text}>
                    Дата окончания регистрации совпадает с датой начала работы, а дата окончания работы
                    совпадает с датой начала оценки для обеспечения непрерывности процесса.
                </p>
            </div>

            {/* Остальные секции */}
            <StepsListWithDates
                ref={stagesRef}
                initialStages={formData.stages}
                onChange={handleStagesChange}
                required
            />

            <CriteriaEditor
                ref={criteriaRef}
                initialCriteria={formData.criteria}
                onChange={handleCriteriaChange}
                required
            />

            <TechnologyStackInput
                ref={techRef}
                initialTechnologies={formData.technologies}
                onChange={handleTechnologyChange}
                required
            />

            <AwardsEditor
                ref={awardsRef}
                initialAwards={formData.awards}
                onChange={handleAwardsChange}
                required
            />

            <MentorStackInput
                onChange={handleMentorChange}
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
                    maxFiles={10}
                    placeholder="Перетащите файлы сюда или нажмите для выбора"
                    error={formErrors.documents}
                />
                <div className={classes.file_help}>
                    <p>Загрузите важные документы: положение о проведении, правила участия, требования к проектам и т.д.</p>
                </div>
            </div>

            {/* Отображаем ошибку в верхней части формы */}
            {createHackathonError && (
                <div className={classes.error_container}>
                    <Error>{createHackathonError}</Error>
                </div>
            )}

            {/* Кнопка публикации */}
            <div className={classes.publish_section}>
                <Button
                    onClick={handlePublishClick}
                    loading={createHackathonLoading}
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