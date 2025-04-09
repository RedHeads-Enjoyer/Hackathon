import React, { useState, useId } from 'react';
import classes from './style.module.css';
import { HackathonStagesProps, Stage } from "./types";
import Button from "../button/Button";
import Input from "../input/Input";
import TextArea from "../textArea/TextArea";
import DatePicker from "../datePicker/DatePicker";
import Modal from "../modal/Modal";

const StepsListWithDates: React.FC<HackathonStagesProps> = ({ initialStages = [], onChange }) => {
    const [stages, setStages] = useState<Stage[]>(initialStages);
    const idGenerator = useId();
    const [expandedStageId, setExpandedStageId] = useState<string | null>(null);
    const [stageToDelete, setStageToDelete] = useState<string | null>(null);

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

        setStages(filteredStages);
        onChange(filteredStages);
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

        return (
            <>
                <span className={classes.stageNameText}>{stage.name || 'Новый этап'}</span>
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
                <h3 className={classes.title}>Этапы хакатона</h3>
                <Button onClick={addStage}>
                    Добавить этап
                </Button>
            </div>

            <div className={classes.stagesList}>
                {stages.map((stage) => (
                    <div key={stage.id} className={classes.stageCard}>
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
                                />

                                <TextArea
                                    label="Описание этапа"
                                    value={stage.description}
                                    onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                                    placeholder="Описание этапа"
                                    minRows={2}
                                />

                                <div className={classes.datesContainer}>
                                    <DatePicker
                                        label="Дата начала"
                                        value={stage.startDate}
                                        onChange={(date) => updateStage(stage.id, 'startDate', date)}
                                    />

                                    <DatePicker
                                        label="Дата окончания"
                                        value={stage.endDate}
                                        onChange={(date) => updateStage(stage.id, 'endDate', date)}
                                        minDate={stage.startDate}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={!!stageToDelete}>
                <div className={classes.modalContent}>
                    <h4 className={classes.modalTitle}>Подтверждение удаления</h4>
                    <p>Вы уверены, что хотите удалить этот этап? Это действие нельзя отменить.</p>
                    <div className={classes.modalActions}>
                        <Button  onClick={executeDelete}>
                            Удалить
                        </Button>
                        <Button onClick={cancelDelete}>
                            Отмена
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default StepsListWithDates;