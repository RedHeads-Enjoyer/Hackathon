import React, { useState, useEffect } from 'react';
import classes from './style.module.css';
import Button from '../button/Button';
import Input from '../input/Input';
import Modal from '../modal/Modal';

interface Award {
    id: string;
    placeFrom: number;
    placeTo: number;
    description: string;
}

const AwardsEditor: React.FC<{
    initialAwards?: Award[];
    onChange: (awards: Award[]) => void;
}> = ({ initialAwards = [], onChange }) => {
    const [awards, setAwards] = useState<Award[]>(initialAwards);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Award, 'id'>>({
        placeFrom: 1,
        placeTo: 1,
        description: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        awardId: string | null;
    }>({ show: false, awardId: null });

    // При инициализации и изменении awards обновляем следующий доступный диапазон
    useEffect(() => {
        if (!editingId) {
            const nextPlace = getNextAvailablePlace();
            setFormData(prev => ({
                ...prev,
                placeFrom: nextPlace,
                placeTo: nextPlace
            }));
        }
    }, [awards, editingId]);

    const handleChange = (field: keyof Award, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Проверка на последовательность диапазонов
    const validateSequence = (newAward: Omit<Award, 'id'>): boolean => {
        const sortedAwards = [...awards].sort((a, b) => a.placeFrom - b.placeFrom);

        // Если это новая награда
        if (!editingId) {
            const lastAward = sortedAwards[sortedAwards.length - 1];
            if (lastAward && newAward.placeFrom !== lastAward.placeTo + 1) {
                alert(`Следующая награда должна начинаться с ${lastAward.placeTo + 1} места`);
                return false;
            }
            return true;
        }

        // Если это редактирование существующей награды
        const editingIndex = sortedAwards.findIndex(a => a.id === editingId);

        // Проверка предыдущей награды
        if (editingIndex > 0) {
            const prevAward = sortedAwards[editingIndex - 1];
            if (newAward.placeFrom !== prevAward.placeTo + 1) {
                alert(`Награда должна начинаться с ${prevAward.placeTo + 1} места`);
                return false;
            }
        }

        // Проверка следующей награды
        if (editingIndex < sortedAwards.length - 1) {
            const nextAward = sortedAwards[editingIndex + 1];
            if (newAward.placeTo + 1 !== nextAward.placeFrom) {
                alert(`Награда должна заканчиваться на ${nextAward.placeFrom - 1} месте`);
                return false;
            }
        }

        return true;
    };

    const getNextAvailablePlace = (): number => {
        if (awards.length === 0) return 1;
        const sortedAwards = [...awards].sort((a, b) => a.placeFrom - b.placeFrom);
        return sortedAwards[sortedAwards.length - 1].placeTo + 1;
    };

    const saveAward = () => {
        if (!formData.description) {
            alert('Введите описание награды');
            return;
        }

        if (formData.placeFrom > formData.placeTo) {
            alert('"Место от" не может быть больше "Место до"');
            return;
        }

        if (!validateSequence(formData)) return;

        const updatedAwards = editingId
            ? awards.map((a) =>
                a.id === editingId ? { ...formData, id: editingId } : a
            )
            : [...awards, { ...formData, id: Date.now().toString() }];

        // Сортируем по месту "от"
        updatedAwards.sort((a, b) => a.placeFrom - b.placeFrom);

        setAwards(updatedAwards);
        onChange(updatedAwards);
        resetForm();
    };

    const editAward = (award: Award) => {
        setEditingId(award.id);
        setFormData({
            placeFrom: award.placeFrom,
            placeTo: award.placeTo,
            description: award.description,
        });
    };

    const confirmDelete = () => {
        if (!editingId) return;
        setDeleteConfirm({ show: true, awardId: editingId });
    };

    const deleteAward = () => {
        if (!deleteConfirm.awardId) return;

        const updatedAwards = awards.filter(
            (a) => a.id !== deleteConfirm.awardId
        );

        // После удаления нужно перенумеровать следующие награды
        const sortedAwards = [...updatedAwards].sort((a, b) => a.placeFrom - b.placeFrom);
        const deletedIndex = awards.findIndex(a => a.id === deleteConfirm.awardId);

        if (deletedIndex < sortedAwards.length) {
            const prevAward = deletedIndex > 0 ? sortedAwards[deletedIndex - 1] : null;
            let currentPlace = prevAward ? prevAward.placeTo + 1 : 1;

            for (let i = deletedIndex; i < sortedAwards.length; i++) {
                const range = sortedAwards[i].placeTo - sortedAwards[i].placeFrom;
                sortedAwards[i].placeFrom = currentPlace;
                sortedAwards[i].placeTo = currentPlace + range;
                currentPlace += range + 1;
            }
        }

        setAwards(sortedAwards);
        onChange(sortedAwards);
        setDeleteConfirm({ show: false, awardId: null });
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
    };

    const formatPlace = (placeFrom: number, placeTo: number): string => {
        return placeFrom === placeTo
            ? `${placeFrom} место`
            : `${placeFrom}-${placeTo} места`;
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>Награды</h3>

            <div className={awards.length !== 0 ? classes.form : ""}>
                <div className={classes.placesRow}>
                    <div className={classes.placeInput}>
                        <Input
                            label="Место от"
                            type="number"
                            value={formData.placeFrom}
                            onChange={(e) => handleChange('placeFrom', Number(e.target.value))}
                            min={1}
                        />
                    </div>
                    <div className={classes.placeInput}>
                        <Input
                            label="Место до"
                            type="number"
                            value={formData.placeTo}
                            onChange={(e) => handleChange('placeTo', Number(e.target.value))}
                            min={formData.placeFrom}
                        />
                    </div>
                </div>

                <div className={classes.inputContainer}>
                    <Input
                        label="Описание награды"
                        type="text"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        placeholder="Например, Бесплатный курс"
                    />
                </div>

                <div className={classes.actions}>
                    <Button
                        onClick={saveAward}
                        disabled={!formData.description}
                        className={classes.mainButton}
                    >
                        {editingId ? 'Сохранить' : 'Добавить награду'}
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

            <div className={classes.awardsList}>
                {awards
                    .sort((a, b) => a.placeFrom - b.placeFrom)
                    .map((award) => (
                        <div
                            key={award.id}
                            className={`${classes.awardCard} ${
                                editingId === award.id ? classes.active : ''
                            }`}
                            onClick={() => editAward(award)}
                        >
                            <div className={classes.awardPlace}>
                                {formatPlace(award.placeFrom, award.placeTo)}
                            </div>
                            <div className={classes.awardDescription}>
                                {award.description}
                            </div>
                        </div>
                    ))}
            </div>

            <Modal
                isOpen={deleteConfirm.show}
            >
                <div className={classes.modalContent}>
                    <h4 className={classes.modalTitle}>Удалить награду?</h4>
                    <p className={classes.modalText}>
                        Вы уверены, что хотите удалить эту награду? Это действие нельзя отменить.
                    </p>
                    <div className={classes.modalActions}>
                        <Button onClick={deleteAward}>
                            Удалить
                        </Button>
                        <Button
                            
                            onClick={() => setDeleteConfirm({ show: false, awardId: null })}
                        >
                            Отмена
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AwardsEditor;