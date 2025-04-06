import React, { useState } from 'react';
import classes from './style.module.css';
import Button from '../button/Button';
import Input from '../input/Input';
import Modal from '../modal/Modal';

interface Criteria {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
}

const CriteriaEditor: React.FC<{
    initialCriteria?: Criteria[];
    onChange: (criteria: Criteria[]) => void;
}> = ({ initialCriteria = [], onChange }) => {
    const [criteria, setCriteria] = useState<Criteria[]>(initialCriteria);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Criteria, 'id'>>({
        name: '',
        minScore: 0,
        maxScore: 10,
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        criterionId: string | null;
    }>({ show: false, criterionId: null });

    const handleChange = (field: keyof Criteria, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const saveCriterion = () => {
        if (!formData.name) return;

        const updatedCriteria = editingId
            ? criteria.map((c) =>
                c.id === editingId ? { ...formData, id: editingId } : c
            )
            : [...criteria, { ...formData, id: Date.now().toString() }];

        setCriteria(updatedCriteria);
        onChange(updatedCriteria);
        resetForm();
    };

    const editCriterion = (criterion: Criteria) => {
        setEditingId(criterion.id);
        setFormData({
            name: criterion.name,
            minScore: criterion.minScore,
            maxScore: criterion.maxScore,
        });
    };

    const confirmDelete = () => {
        if (!editingId) return;
        setDeleteConfirm({ show: true, criterionId: editingId });
    };

    const deleteCriterion = () => {
        if (!deleteConfirm.criterionId) return;

        const updatedCriteria = criteria.filter(
            (c) => c.id !== deleteConfirm.criterionId
        );
        setCriteria(updatedCriteria);
        onChange(updatedCriteria);
        setDeleteConfirm({ show: false, criterionId: null });
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', minScore: 0, maxScore: 10 });
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>Критерии оценки</h3>

            <div className={criteria.length !== 0 ? classes.form : ""}>
                <div className={classes.input_container}>
                    <label className={classes.label}>Название критерия</label>
                    <input
                        className={classes.input}
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Например, Качество кода"
                    />
                </div>

                <div className={classes.scores}>
                    <div className={classes.input_container}>
                        <Input
                            label={"Минимальный балл"}
                            type="number"
                            value={formData.minScore}
                            onChange={(e) => handleChange('minScore', Number(e.target.value))}
                            min={0}
                            max={formData.maxScore - 1}
                        />
                    </div>
                    <div className={classes.input_container}>
                        <Input
                            label={"Максимальный балл"}
                            type="number"
                            className={classes.input}
                            value={formData.maxScore}
                            onChange={(e) => handleChange('maxScore', Number(e.target.value))}
                            min={formData.minScore + 1}
                            max={100}
                        />
                    </div>
                </div>

                <div className={classes.actions}>
                    <Button
                        onClick={saveCriterion}
                        disabled={!formData.name}
                        className={classes.mainButton}
                    >
                        {editingId ? 'Сохранить' : 'Добавить критерий'}
                    </Button>

                    {editingId && (
                        <>
                            <Button
                                onClick={resetForm}
                                className={classes.secondaryButton}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className={classes.secondaryButton}
                            >
                                Удалить
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className={classes.criteriaList}>
                {criteria.map((criterion) => (
                    <div
                        key={criterion.id}
                        className={`${classes.criterionCard} ${
                            editingId === criterion.id ? classes.active : ''
                        }`}
                        onClick={() => editCriterion(criterion)}
                    >
                        <div className={classes.scoreRange}>
                            {criterion.minScore} - {criterion.maxScore} баллов
                        </div>
                        <div className={classes.criterionName}>{criterion.name}</div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, criterionId: null })}
            >
                <div className={classes.modalContent}>
                    <h4 className={classes.modalTitle}>Удалить критерий?</h4>
                    <p className={classes.modalText}>
                        Вы уверены, что хотите удалить этот критерий? Это действие нельзя отменить.
                    </p>
                    <div className={classes.modalActions}>
                        <Button variant="danger" onClick={deleteCriterion}>
                            Удалить
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteConfirm({ show: false, criterionId: null })}
                        >
                            Отмена
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CriteriaEditor;