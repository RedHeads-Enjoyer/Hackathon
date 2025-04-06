import React, { useState, useId } from 'react';
import classes from './style.module.css';
import { HackathonStagesProps, Stage } from "./types.ts";
import Button from "../button/Button.tsx";
import Input from "../input/Input.tsx";
import TextArea from "../textArea/TextArea.tsx";
import DatePicker from "../datePicker/DatePicker.tsx";

const StepsListWithDates: React.FC<HackathonStagesProps> = ({ initialStages = [], onChange }) => {
    const [stages, setStages] = useState<Stage[]>(initialStages);
    const idGenerator = useId();

    const addStage = () => {
        const newStage: Stage = {
            id: `${idGenerator}-${stages.length}`,
            order: stages.length + 1,
            name: '',
            description: '',
            startDate: '',
            endDate: ''
        };
        const updatedStages = [...stages, newStage];
        setStages(updatedStages);
        onChange(updatedStages);
    };

    const updateStage = (id: string, field: keyof Stage, value: string) => {
        const updatedStages = stages.map(stage => {
            if (stage.id === id) {
                return { ...stage, [field]: value };
            }
            return stage;
        });
        setStages(updatedStages);
        onChange(updatedStages);
    };

    const removeStage = (id: string) => {
        const filteredStages = stages.filter(stage => stage.id !== id)
            .map((stage, index) => ({ ...stage, order: index + 1 }));
        setStages(filteredStages);
        onChange(filteredStages);
    };

    return (
        <div className={classes.container}>
            <div className={stages.length === 0 ? classes.headerNull : classes.header}>
                <h3 className={classes.title}>Этапы хакатона</h3>
                <Button
                    onClick={addStage}
                >
                    Добавить этап
                </Button>
            </div>

            <div className={classes.stagesList}>
                {stages.map((stage) => (
                    <div key={stage.id} className={classes.stageCard}>
                        <div className={classes.stageHeader}>
                            <div className={classes.stageBadge}>Этап {stage.order}</div>
                            <Button
                                onClick={() => removeStage(stage.id)}
                            >
                                Удалить
                            </Button>
                        </div>

                        <div className={classes.stageContent}>
                            <Input
                                label="Название этапа"
                                name="name"
                                type="text"
                                value={stage.name}
                                onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                                placeholder="Например, Регистрация"
                            />

                            <TextArea
                                label="Описание этапа"
                                value={stage.description}
                                onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                                placeholder="Описание этапа"
                                minRows={3}
                            />

                            <div className={classes.datesContainer}>
                                <DatePicker
                                    label="Дата начала"
                                    value={stage.startDate}
                                    onChange={(date) => {
                                        updateStage(stage.id, 'startDate', date);
                                        if (stage.endDate && date > stage.endDate) {
                                            updateStage(stage.id, 'endDate', '');
                                        }
                                    }}
                                />

                                <DatePicker
                                    label="Дата окончания"
                                    value={stage.endDate}
                                    onChange={(date) => updateStage(stage.id, 'endDate', date)}
                                    minDate={stage.startDate}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StepsListWithDates;