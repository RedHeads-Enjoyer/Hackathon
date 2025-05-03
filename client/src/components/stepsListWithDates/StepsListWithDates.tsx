import { useState, useId, useImperativeHandle, forwardRef } from 'react';
import classes from './style.module.css';
import { HackathonStagesProps, Stage } from "./types";
import Button from "../button/Button";
import Input from "../input/Input";
import TextArea from "../textArea/TextArea";
import DatePicker from "../datePicker/DatePicker";
import Modal from "../modal/Modal";

// Расширяем интерфейс, чтобы включить только то, что нам нужно
export interface StepsListWithDatesRef {
    validate: () => boolean; // Метод для валидации
}

const StepsListWithDates = forwardRef<StepsListWithDatesRef, HackathonStagesProps>(({
                                                                                        initialStages = [],
                                                                                        onChange,
                                                                                        required = false
                                                                                    }, ref) => {
    const [stages, setStages] = useState<Stage[]>(initialStages);
    const [stageErrors, setStageErrors] = useState<Record<string, Record<string, string>>>({});
    const [showValidation, setShowValidation] = useState(false);
    const idGenerator = useId();
    const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
    const [stageToDelete, setStageToDelete] = useState<string | null>(null);

    // Метод валидации - будет вызываться родительским компонентом
    const validateStages = (): boolean => {
        const errors: Record<string, Record<string, string>> = {};
        let isValid = true;

        // Проверка что массив этапов не пуст
        if (required && stages.length === 0) {
            isValid = false;
            // Показываем ошибку на уровне компонента
            setShowValidation(true);
            return isValid; // Сразу возвращаем результат, если нет этапов
        }

        // Проверка каждого этапа
        stages.forEach((stage, index) => {
            const stageError: Record<string, string> = {};

            // Проверка названия
            if (!stage.name || stage.name.trim() === '') {
                stageError.name = 'Название этапа обязательно';
                isValid = false;
            }

            // Проверка описания (теперь обязательное)
            if (!stage.description || stage.description.trim() === '') {
                stageError.description = 'Описание этапа обязательно';
                isValid = false;
            }

            // Проверка дат
            if (!stage.startDate) {
                stageError.startDate = 'Дата начала обязательна';
                isValid = false;
            }

            if (!stage.endDate) {
                stageError.endDate = 'Дата окончания обязательна';
                isValid = false;
            }

            // Проверка корректности дат
            if (stage.startDate && stage.endDate && new Date(stage.startDate) > new Date(stage.endDate)) {
                stageError.endDate = 'Дата окончания должна быть позже даты начала';
                isValid = false;
            }

            // Проверка последовательности этапов
            if (index > 0 && stage.startDate && stages[index-1].endDate) {
                const prevEndDate = new Date(stages[index-1].endDate);
                const currentStartDate = new Date(stage.startDate);

                if (currentStartDate < prevEndDate) {
                    stageError.startDate = 'Начало этапа должно быть после окончания предыдущего';
                    isValid = false;
                }
            }

            // Если есть ошибки, добавляем их
            if (Object.keys(stageError).length > 0) {
                errors[stage.id] = stageError;
            }
        });

        setStageErrors(errors);
        setShowValidation(true);

        return isValid;
    };

    // Экспортируем метод валидации для родительского компонента
    useImperativeHandle(ref, () => ({
        validate: validateStages
    }));

    const addStage = () => {
        const newStage: Stage = {
            id: `${idGenerator}-${Date.now()}`,
            order: stages.length + 1,
            name: '',
            description: '',
            startDate: stages.length > 0 ? stages[stages.length-1].endDate : '',
            endDate: ''
        };
        const updatedStages = [...stages, newStage];
        setStages(updatedStages);
        onChange(updatedStages);
        setExpandedStageId(newStage.id);

        // Скрываем сообщение об ошибке при добавлении этапа, если оно было
        if (showValidation && stages.length === 0) {
            setShowValidation(false);
        }
    };

    const updateStage = (id: string, field: keyof Stage, value: string) => {
        const updatedStages = stages.map(stage => {
            if (stage.id === id) {
                const updated = {...stage, [field]: value};

                if (field === 'endDate' && value) {
                    const nextStageIndex = stages.findIndex(s => s.id === id) + 1;
                    if (nextStageIndex < stages.length) {
                        updatedStages[nextStageIndex].startDate = value;
                    }
                }

                return updated;
            }
            return stage;
        });

        // Очищаем ошибку при изменении поля, если отображаются ошибки
        if (showValidation && stageErrors[id]?.[field]) {
            const newErrors = {...stageErrors};
            if (newErrors[id]) {
                delete newErrors[id][field];
                if (Object.keys(newErrors[id]).length === 0) {
                    delete newErrors[id];
                }
                setStageErrors(newErrors);
            }
        }

        setStages(updatedStages);
        onChange(updatedStages);
    };

    const confirmDelete = (id: string) => {
        setStageToDelete(id);
    };

    const cancelDelete = () => {
        setStageToDelete(null);
    };

    const executeDelete = () => {
        if (!stageToDelete) return;

        const index = stages.findIndex(stage => stage.id === stageToDelete);
        const filteredStages = stages.filter(stage => stage.id !== stageToDelete)
            .map((stage, i) => ({ ...stage, order: i + 1 }));

        if (index > 0 && index < stages.length - 1) {
            filteredStages[index].startDate = filteredStages[index-1].endDate;
        }

        // Удаляем ошибки для удаленного этапа
        if (stageErrors[stageToDelete]) {
            const newErrors = {...stageErrors};
            delete newErrors[stageToDelete];
            setStageErrors(newErrors);
        }

        setStages(filteredStages);
        onChange(filteredStages);

        // Если после удаления не осталось этапов и они обязательны, показываем ошибку
        if (required && filteredStages.length === 0) {
            setShowValidation(true);
        }

        if (expandedStageId === stageToDelete) {
            setExpandedStageId(null);
        }
        setStageToDelete(null);
    };

    const toggleExpand = (id: string) => {
        setExpandedStageId(expandedStageId === id ? null : id);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\s/g, '');
    };

    const getStageTitle = (stage: Stage) => {
        const dates = [];
        if (stage.startDate) dates.push(formatDate(stage.startDate));
        if (stage.endDate) dates.push(formatDate(stage.endDate));

        const hasErrors = stageErrors[stage.id] && Object.keys(stageErrors[stage.id]).length > 0;

        return (
            <>
                <span className={`${classes.stageNameText} ${hasErrors ? classes.stageError : ''}`}>
                    {stage.name || 'Новый этап'}
                </span>
                {dates.length > 0 && (
                    <span className={classes.stageDatesText}>
                        {' '}{dates.join(' — ')}
                    </span>
                )}
            </>
        );
    };

    return (
        <div className={classes.container}>
            <div className={stages.length === 0 ? classes.headerNull : classes.header}>
                <h3 className={classes.title}>
                    Этапы хакатона
                    {required && <span className={classes.required}>*</span>}
                </h3>
                <Button onClick={addStage}>
                    Добавить этап
                </Button>
            </div>

            {showValidation && required && stages.length === 0 && (
                <div className={classes.errorMessage}>
                    Добавьте хотя бы один этап хакатона
                </div>
            )}

            <div className={classes.stagesList}>
                {stages.map((stage) => {
                    const hasErrors = stageErrors[stage.id] && Object.keys(stageErrors[stage.id]).length > 0;

                    return (
                        <div key={stage.id} className={`${classes.stageCard} ${hasErrors ? classes.stageCardError : ''}`}>
                            <div
                                className={classes.stageHeader}
                                onClick={() => toggleExpand(stage.id)}
                            >
                                <div className={classes.stageSummary}>
                                    <span className={classes.stageBadge}>Этап {stage.order}</span>
                                    <span className={classes.stageTitle}>
                                        {getStageTitle(stage)}
                                    </span>
                                </div>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDelete(stage.id);
                                    }}
                                    size={"sm"}
                                    variant={"secondary"}
                                >
                                    Удалить
                                </Button>
                            </div>

                            {expandedStageId === stage.id && (
                                <div className={classes.stageContent}>
                                    <Input
                                        label="Название этапа"
                                        value={stage.name}
                                        onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                                        placeholder="Например, Регистрация"
                                        type={"text"}
                                        required
                                        error={stageErrors[stage.id]?.name}
                                    />

                                    <TextArea
                                        label="Описание этапа"
                                        value={stage.description}
                                        onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                                        placeholder="Описание этапа"
                                        minRows={2}
                                        required
                                        error={stageErrors[stage.id]?.description}
                                    />

                                    <div className={classes.datesContainer}>
                                        <DatePicker
                                            label="Дата начала"
                                            value={stage.startDate}
                                            onChange={(date) => updateStage(stage.id, 'startDate', date)}
                                            required
                                            error={stageErrors[stage.id]?.startDate}
                                        />

                                        <DatePicker
                                            label="Дата окончания"
                                            value={stage.endDate}
                                            onChange={(date) => updateStage(stage.id, 'endDate', date)}
                                            minDate={stage.startDate}
                                            required
                                            error={stageErrors[stage.id]?.endDate}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={!!stageToDelete}
                rejectText={"Отмена"}
                confirmText={"Удалить"}
                onReject={() => cancelDelete()}
                onConfirm={() => executeDelete()}
                title={"Подтверждение удаления"}
            >
                <p>Вы уверены, что хотите удалить этот этап? Это действие нельзя отменить.</p>
            </Modal>
        </div>
    );
});

export default StepsListWithDates;