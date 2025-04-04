import React, { useState, useId } from 'react';
import classes from './style.module.css';
import { HackathonStagesProps, Stage } from "./types.ts";
import Button from "../button/Button.tsx";
import Input from "../input/Input.tsx"
import TextArea from "../textArea/TextArea.tsx";

const StepsListWithDates: React.FC<HackathonStagesProps> = ({ initialStages = [], onChange }) => {
    const [stages, setStages] = useState<Stage[]>(initialStages);
    const idGenerator = useId(); // Выносим хук на верхний уровень компонента

    const addStage = () => {
        const newStage: Stage = {
            id: `${idGenerator}-${stages.length}`, // Используем генератор ID
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
            <h3 className={classes.title}>Этапы хакатона</h3>

            {stages.map((stage) => (
                <div key={stage.id} className={classes.stageCard}>
                    <div className={classes.stageHeader}>
                        <span className={classes.stageNumber}>Этап {stage.order}</span>
                        <Button
                            onClick={() => removeStage(stage.id)}
                        >
                            Удалить
                        </Button>
                    </div>

                    <div >
                        <Input
                            label={"Название этапа"}
                            name={"name"}
                            type="text"
                            value={stage.name}
                            onChange={(e) => updateStage(stage.id, 'name', e.target.value)}
                            placeholder="Например, Регистрация"
                        />
                    </div>

                    <div>
                        <TextArea
                            label={"Описание этапа"}
                            value={stage.description}
                            onChange={(e) => updateStage(stage.id, 'description', e.target.value)}
                            placeholder="Описание этапа"
                        />
                    </div>

                    <div className={classes.dateRow}>
                        <div className={classes.formGroup}>
                            <label>Дата начала</label>
                            <input
                                type="date"
                                value={stage.startDate}
                                onChange={(e) => updateStage(stage.id, 'startDate', e.target.value)}
                            />
                        </div>

                        <div className={classes.formGroup}>
                            <label>Дата окончания</label>
                            <input
                                type="date"
                                value={stage.endDate}
                                onChange={(e) => updateStage(stage.id, 'endDate', e.target.value)}
                                min={stage.startDate}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button
                type="button"
                onClick={addStage}
                className={classes.addButton}
            >
                + Добавить этап
            </button>
        </div>
    );
};

export default StepsListWithDates;