import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import classes from './hackathon.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import TextArea from "../../components/textArea/TextArea.tsx";
import ImageUploader from "../../components/imageUploader/ImageUploader.tsx";
import StepsListWithDates, { StepsListWithDatesRef } from "../../components/stepsListWithDates/StepsListWithDates.tsx";
import { Stage } from "../../components/stepsListWithDates/types.ts";
import TechnologyStackInput, {
    TechnologyStackInputRef
} from "../../components/technologyStackInput/TechnologyStackInput.tsx";
import CriteriaEditor, { CriteriaEditorRef } from "../../components/criteriaEditor/CriteriaEditor.tsx";
import AwardsEditor, { AwardsEditorRef } from "../../components/awardsEditor/AwardsEditor.tsx";
import DatePicker from "../../components/datePicker/DatePicker.tsx";
import Button from "../../components/button/Button.tsx";
import Modal from "../../components/modal/Modal.tsx";
import SelectSearch from "../../components/searchSelect/SearchSelect.tsx";
import { Option } from "../organozaton/types.ts";
import FileUpload from "../../components/fileUpload/FileUpload.tsx";
import { Award, Criteria, HackathonFormData, HackathonFormErrors } from "./types.ts";
import Error from "../../components/error/Error.tsx";
import { hackathonAPI } from "./hackathonAPI.ts";
import Loader from "../../components/loader/Loader.tsx";
import MentorInviteStackInput from "../../components/mentorInviteStackInput/MentorInviteStackInput.tsx";

const HackathonDashboard: React.FC = () => {
    // Получаем ID хакатона из URL параметров
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // Состояние для хранения данных формы
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
        stages: [],
        criteria: [],
        technologies: [],
        awards: [],
        mentorInvites: [],
        documents: [],
    });

    // Дополнительные состояния для управления формой
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [updateHackathonLoading, setUpdateHackathonLoading] = useState<boolean>(false);
    const [updateHackathonError, setUpdateHackathonError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<HackathonFormErrors>({});

    const [initialOrganization, setInitialOrganization] = useState<Option | undefined>(undefined)

    // Состояния для управления существующими файлами и изображениями
    const [logoId, setLogoId] = useState<number | null>(null);
    const [existingDocuments, setExistingDocuments] = useState<Array<any>>([]);
    const [filesToDelete, setFilesToDelete] = useState<number[]>([]); // ID файлов для удаления
    const [isLogoChanged, setIsLogoChanged] = useState<boolean>(false);
    const [mentorInvitesToDelete, setMentorInvitesToDelete] = useState<number[]>([]);
    const [newMentorInvites, setNewMentorInvites] = useState<Array<{userId: number, username: string}>>([]);

    // Рефы для доступа к компонентам дочерних форм
    const stagesRef = useRef<StepsListWithDatesRef>(null);
    const criteriaRef = useRef<CriteriaEditorRef>(null);
    const techRef = useRef<TechnologyStackInputRef>(null);
    const awardsRef = useRef<AwardsEditorRef>(null);

    // Загрузка данных хакатона при монтировании компонента
    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            setUpdateHackathonError("ID хакатона не указан");
            return;
        }

        const fetchHackathonData = async () => {
            try {
                const hackathonId = parseInt(id, 10);
                const data = await hackathonAPI.getFullForEditById(hackathonId);

                // Форматируем даты для полей ввода
                const formatDate = (dateStr: string | null) => {
                    if (!dateStr) return '';
                    const date = new Date(dateStr);
                    return date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
                };

                // Сохраняем ID логотипа, если есть
                if (data.logoId) {
                    setLogoId(data.logoId);
                }

                // Сохраняем информацию о документах
                if (data.files && data.files.length > 0) {
                    setExistingDocuments(data.files.map(file => ({
                        ...file,
                        isExisting: true
                    })));
                }

                // Преобразуем данные API в формат formData
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    coverImage: null,

                    regDateFrom: formatDate(data.regDateFrom),
                    regDateTo: formatDate(data.regDateTo),
                    workDateFrom: formatDate(data.workDateFrom),
                    workDateTo: formatDate(data.workDateTo),
                    evalDateFrom: formatDate(data.evalDateFrom),
                    evalDateTo: formatDate(data.evalDateTo),

                    minTeamSize: data.minTeamSize || 1,
                    maxTeamSize: data.maxTeamSize || 5,
                    organizationId: data.organizationId || 0,

                    stages: data.steps?.map(step => ({
                        id: step.id,
                        name: step.name,
                        description: step.description || '',
                        startDate: formatDate(step.startDate),
                        endDate: formatDate(step.endDate)
                    })) || [],

                    criteria: data.criteria?.map(criterion => ({
                        id: criterion.id,
                        name: criterion.name,
                        minScore: criterion.minScore,
                        maxScore: criterion.maxScore
                    })) || [],

                    technologies: data.technologies?.map(tech => ({
                        value: tech.id,
                        label: tech.name,
                    })) || [],

                    awards: data.awards?.map(award => ({
                        id: award.id,
                        placeFrom: award.placeFrom,
                        placeTo: award.placeTo,
                        moneyAmount: award.moneyAmount,
                        additionally: award.additionally || ''
                    })) || [],

                    documents: [],
                    mentorInvites: data.mentorInvites
                });

                setInitialOrganization({
                    label: data.organizationName,
                    value: data.organizationId
                })
            } catch (err) {
                const errorMessage = (err as Error).message || "Ошибка при загрузке данных хакатона";
                setUpdateHackathonError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHackathonData();
    }, [id]);

    // Объединяем новые и существующие документы для отображения в UI
    useEffect(() => {
        if (existingDocuments.length > 0) {
            setFormData(prev => ({
                ...prev,
                documents: [...existingDocuments, ...prev.documents.filter(doc => !(doc as any).isExisting)]
            }));
        }
    }, [existingDocuments]);

    // Валидация формы
    const validateForm = () => {
        const errors: HackathonFormErrors = {};

        if (!formData.name) {
            errors.name = "Название хакатона не может быть пустым";
        }

        if (!formData.description) {
            errors.description = "Описание хакатона не может быть пустым";
        }

        if (formData.organizationId === 0) {
            errors.organizationId = "Организация не может быть пустой";
        }

        // Проверяем изображение только если нет существующего логотипа
        if (!formData.coverImage && !logoId) {
            errors.coverImage = "Изображение не может быть пустым";
        }

        // Проверка дат
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

        // Проверка размера команды
        if (!formData.minTeamSize) {
            errors.minTeamSize = "Размер команды не может быть пустым";
        }

        if (formData.minTeamSize && formData.minTeamSize === 0) {
            errors.minTeamSize = "Размер команды не может быть 0";
        }

        if (!formData.maxTeamSize) {
            errors.maxTeamSize = "Размер команды не может быть пустым";
        }

        if (formData.maxTeamSize && formData.maxTeamSize === 0) {
            errors.maxTeamSize = "Размер команды не может быть 0";
        }

        // Проверка наличия этапов
        if (formData.stages.length === 0) {
            errors.stages = "Добавьте хотя бы один этап хакатона";
        }

        // Проверка валидности через рефы
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

        // Проверка наличия документов
        if (formData.documents.length === 0) {
            errors.documents = "Загрузите хотя бы один документ";
        }

        return errors;
    };

    // Открытие модального окна подтверждения
    const handleUpdateClick = () => {
        setIsPublishModalOpen(true);
    };

    // Обработка подтверждения обновления
    const confirmUpdate = async () => {
        setIsPublishModalOpen(false);
        setUpdateHackathonError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setUpdateHackathonError("Пожалуйста, исправьте ошибки в форме перед сохранением изменений");
            return;
        }

        setUpdateHackathonLoading(true);

        try {
            const formDataToSend = new FormData();

            // Подготавливаем JSON-объект для всех остальных данных
            const hackathonDTO = {
                name: formData.name,
                description: formData.description,

                // Даты
                reg_date_from: new Date(formData.regDateFrom).toISOString(),
                reg_date_to: new Date(formData.regDateTo).toISOString(),
                work_date_from: new Date(formData.workDateFrom).toISOString(),
                work_date_to: new Date(formData.workDateTo).toISOString(),
                eval_date_from: new Date(formData.evalDateFrom).toISOString(),
                eval_date_to: new Date(formData.evalDateTo).toISOString(),

                // Размеры команд
                min_team_size: formData.minTeamSize,
                max_team_size: formData.maxTeamSize,

                // ID организации
                organization_id: formData.organizationId,

                // Технологии - отправляем массив ID
                technologies: formData.technologies.map(tech => tech.value),

                // Этапы
                steps: formData.stages.map(stage => ({
                    name: stage.name,
                    description: stage.description,
                    start_date: new Date(stage.startDate).toISOString(),
                    end_date: new Date(stage.endDate).toISOString()
                })),

                // Критерии оценки
                criteria: formData.criteria.map(criterion => ({
                    name: criterion.name,
                    min_score: criterion.minScore,
                    max_score: criterion.maxScore
                })),

                // Награды
                awards: formData.awards.map(award => ({
                    place_from: award.placeFrom,
                    place_to: award.placeTo,
                    money_amount: award.moneyAmount,
                    additionally: award.additionally
                })),

                mentors: newMentorInvites.map(invite => invite.userId),
                mentor_invites_to_delete: mentorInvitesToDelete.length > 0 ? mentorInvitesToDelete : undefined,

                // Добавляем список файлов для удаления, если есть
                files_to_delete: filesToDelete.length > 0 ? filesToDelete : undefined,

                delete_logo: isLogoChanged
            };

            // Добавляем JSON данные в FormData
            formDataToSend.append('data', JSON.stringify(hackathonDTO));

            // Добавляем файл обложки только если он был изменен
            if (formData.coverImage && isLogoChanged) {
                formDataToSend.append('logo', formData.coverImage);
                console.log("Добавляем логотип в запрос", formData.coverImage);
            }

            // Добавляем только новые документы
            const newDocuments = formData.documents.filter(doc => !(doc as any).isExisting);
            newDocuments.forEach(doc => {
                formDataToSend.append('files', doc);
            });

            // Отладочный вывод
            console.log("Отправляем данные:", {
                jsonData: JSON.parse(formDataToSend.get('data') as string),
                hasLogo: formDataToSend.has('logo'),
                filesCount: newDocuments.length
            });

            // Вызываем API обновления
            if (typeof id === "string") {
                await hackathonAPI.update(parseInt(id, 10), formDataToSend);
            }
            navigate(`/hackathon/${id}`);
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при обновлении хакатона";
            setUpdateHackathonError(errorMessage);
        } finally {
            setUpdateHackathonLoading(false);
        }
    };

    // Обработчики изменения значений полей формы
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

        setFormErrors(prev => ({
            ...prev,
            [name]: undefined
        }));
    };

    const handleMentorInviteChange = (
        newInvites: Array<{userId: number, username: string}>,
        invitesToDelete: Array<number>
    ) => {
        setNewMentorInvites(newInvites);
        setMentorInvitesToDelete(invitesToDelete);
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

        setIsLogoChanged(true);
        setLogoId(null);

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
        }));
    };

    const handleOrganizationIdChange = (option: Option) => {
        setFormData(prev => ({
            ...prev,
            organizationId: option.value
        }));

        setFormErrors(prev => ({
            ...prev,
            organizationId: undefined
        }));
    };

    const handleFilesChange = (files: File[]) => {
        // Проверяем, какие файлы были удалены
        const currentExistingFileIds = new Set(
            files
                .filter(file => (file as any).isExisting)
                .map(file => (file as any).id)
        );

        // Находим ID существующих файлов, которых нет в текущем списке
        const deletedFileIds = existingDocuments
            .filter(doc => !currentExistingFileIds.has(doc.id))
            .map(doc => doc.id);

        // Добавляем удаленные файлы в общий список для удаления
        if (deletedFileIds.length > 0) {
            setFilesToDelete(prev => [...prev, ...deletedFileIds]);
        }

        // Обновляем список документов
        setFormData(prev => ({
            ...prev,
            documents: files
        }));

        setFormErrors(prev => ({
            ...prev,
            documents: undefined
        }));
    };

    // Если идет загрузка, показываем индикатор загрузки
    if (isLoading) {
        return (
            <div className={classes.page_wrapper}>
                <PageLabel size={'h3'}>Редактирование хакатона</PageLabel>
                <Loader/>
            </div>
        );
    }

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Редактирование хакатона</PageLabel>

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
                            initialOption={initialOrganization}
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
                            initialFileId={logoId}
                            required={!logoId}
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
                        maxDate={formData.regDateTo || formData.workDateFrom || formData.workDateTo || formData.evalDateFrom || formData.evalDateTo}
                        error={formErrors.regDateFrom}
                        required
                    />
                    <DatePicker
                        label="Окончание регистрации"
                        value={formData.regDateTo}
                        onChange={(value) => handleDateChange('regDateTo', value)}
                        minDate={formData.regDateFrom}
                        maxDate={formData.workDateFrom || formData.workDateTo || formData.evalDateFrom || formData.evalDateTo}
                        error={formErrors.regDateTo}
                        required
                    />
                    <DatePicker
                        label="Начало работы"
                        value={formData.workDateFrom}
                        onChange={(value) => handleDateChange('workDateFrom', value)}
                        minDate={formData.regDateTo || formData.regDateFrom}
                        maxDate={formData.workDateTo || formData.evalDateFrom || formData.evalDateTo}
                        error={formErrors.workDateFrom}
                        required
                    />
                    <DatePicker
                        label="Окончание работы"
                        value={formData.workDateTo}
                        onChange={(value) => handleDateChange('workDateTo', value)}
                        minDate={formData.workDateFrom || formData.regDateTo || formData.regDateFrom}
                        maxDate={formData.evalDateFrom || formData.evalDateTo}
                        error={formErrors.workDateTo}
                        required
                    />
                    <DatePicker
                        label="Начало оценки"
                        value={formData.evalDateFrom}
                        onChange={(value) => handleDateChange('evalDateFrom', value)}
                        minDate={formData.workDateTo || formData.workDateFrom || formData.regDateTo || formData.regDateFrom}
                        maxDate={formData.evalDateTo}
                        error={formErrors.evalDateFrom}
                        required
                    />
                    <DatePicker
                        label="Окончание оценки"
                        value={formData.evalDateTo}
                        onChange={(value) => handleDateChange('evalDateTo', value)}
                        minDate={formData.evalDateFrom || formData.workDateTo || formData.workDateFrom || formData.regDateTo || formData.regDateFrom}
                        error={formErrors.evalDateTo}
                        required
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
                        error={formErrors.minTeamSize}
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
                        error={formErrors.maxTeamSize}
                        required
                    />
                </div>
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

            <MentorInviteStackInput
                mentorInvites={formData.mentorInvites}
                onChange={handleMentorInviteChange}
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
                    maxFileSize={5 * 1024 * 1024}
                    maxFiles={10}
                    placeholder="Перетащите файлы сюда или нажмите для выбора"
                    error={formErrors.documents}
                />
                <div className={classes.file_help}>
                    <p>Загрузите важные документы: положение о проведении, правила участия, требования к проектам и т.д.</p>
                </div>
            </div>

            {/* Отображаем ошибку в верхней части формы */}
            {updateHackathonError && (
                <div className={classes.error_container}>
                    <Error>{updateHackathonError}</Error>
                </div>
            )}

            {/* Кнопка сохранения */}
            <div className={classes.publish_section}>
                <Button
                    onClick={handleUpdateClick}
                    loading={updateHackathonLoading}
                >
                    Сохранить изменения
                </Button>
            </div>

            {/* Модальное окно подтверждения */}
            <Modal
                isOpen={isPublishModalOpen}
                onConfirm={confirmUpdate}
                onReject={() => setIsPublishModalOpen(false)}
                title="Подтверждение изменений"
                confirmText="Сохранить"
                rejectText="Отмена"
            >
                <p className={classes.modalText}>
                    Вы уверены, что хотите сохранить изменения в хакатоне?
                </p>
            </Modal>
        </div>
    );
};

export default HackathonDashboard;