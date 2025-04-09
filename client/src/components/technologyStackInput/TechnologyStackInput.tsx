import React, { useState, useId } from 'react';
import classes from './style.module.css';
import Button from '../button/Button';
import Input from '../input/Input';
import Modal from '../modal/Modal';

interface TechnologyStackInputProps {
    initialTechnologies?: string[];
    onChange: (technologies: string[]) => void;
}

const TechnologyStackInput: React.FC<TechnologyStackInputProps> = ({
                                                                       initialTechnologies = [],
                                                                       onChange
                                                                   }) => {
    const [technologies, setTechnologies] = useState<string[]>(initialTechnologies);
    const [currentTech, setCurrentTech] = useState('');
    const [editingTech, setEditingTech] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        techToDelete: string | null;
    }>({ show: false, techToDelete: null });
    const idGenerator = useId();

    const addTechnology = () => {
        if (!currentTech.trim()) return;

        if (editingTech) {
            // Редактирование существующей технологии
            const updatedTechs = technologies.map(tech =>
                tech === editingTech ? currentTech.trim() : tech
            );
            setTechnologies(updatedTechs);
            onChange(updatedTechs);
            resetForm();
        } else {
            // Добавление новой технологии
            if (!technologies.includes(currentTech.trim())) {
                const updatedTechs = [...technologies, currentTech.trim()];
                setTechnologies(updatedTechs);
                onChange(updatedTechs);
                setCurrentTech('');
            }
        }
    };

    const editTechnology = (tech: string) => {
        setEditingTech(tech);
        setCurrentTech(tech);
    };

    const confirmDelete = () => {
        if (!editingTech) return;
        setDeleteConfirm({ show: true, techToDelete: editingTech });
    };

    const deleteTechnology = () => {
        if (!deleteConfirm.techToDelete) return;

        const updatedTechs = technologies.filter(
            tech => tech !== deleteConfirm.techToDelete
        );
        setTechnologies(updatedTechs);
        onChange(updatedTechs);
        setDeleteConfirm({ show: false, techToDelete: null });
        resetForm();
    };

    const resetForm = () => {
        setEditingTech(null);
        setCurrentTech('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTechnology();
        }
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>Стек технологий</h3>

            <div className={technologies.length !== 0 ? classes.form : ""}>
                <div className={classes.inputContainer}>
                    <Input
                        type="text"
                        value={currentTech}
                        onChange={(e) => setCurrentTech(e.target.value)}
                        placeholder="Например, React или TypeScript"
                        onKeyDown={handleKeyDown}
                    />
                </div>

                <div className={classes.actions}>
                    <Button
                        onClick={addTechnology}
                        disabled={!currentTech.trim()}
                        className={classes.mainButton}
                    >
                        {editingTech ? 'Сохранить' : 'Добавить'}
                    </Button>

                    {editingTech && (
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

            {technologies.length > 0 && (
                <div className={classes.techList}>
                    {technologies.map((tech) => (
                        <div
                            key={`${idGenerator}-${tech}`}
                            className={`${classes.techItem} ${
                                editingTech === tech ? classes.active : ''
                            }`}
                            onClick={() => editTechnology(tech)}
                        >
                            {tech}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={deleteConfirm.show}
            >
                <div className={classes.modalContent}>
                    <h4 className={classes.modalTitle}>Удалить технологию?</h4>
                    <p className={classes.modalText}>
                        Вы уверены, что хотите удалить "{deleteConfirm.techToDelete}" из списка?
                    </p>
                    <div className={classes.modalActions}>
                        <Button onClick={deleteTechnology}>
                            Удалить
                        </Button>
                        <Button
                            onClick={() => setDeleteConfirm({ show: false, techToDelete: null })}
                        >
                            Отмена
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default TechnologyStackInput;