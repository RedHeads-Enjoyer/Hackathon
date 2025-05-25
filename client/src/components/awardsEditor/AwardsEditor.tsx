import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import classes from './style.module.css';
import Button from '../button/Button';
import Input from '../input/Input';
import Modal from '../modal/Modal';

interface Award {
    id: string;
    placeFrom: number;
    placeTo: number;
    moneyAmount: number;
    additionally: string;
}

// Интерфейс для ref
export interface AwardsEditorRef {
    validate: () => boolean;
}

interface AwardsEditorProps {
    initialAwards?: Award[];
    onChange: (awards: Award[]) => void;
    required?: boolean;
}

const AwardsEditor = forwardRef<AwardsEditorRef, AwardsEditorProps>(({
                                                                         initialAwards = [],
                                                                         onChange,
                                                                         required = false
                                                                     }, ref) => {
    const [awards, setAwards] = useState<Award[]>(initialAwards);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Award, 'id'>>({
        placeFrom: 1,
        placeTo: 1,
        moneyAmount: 0,
        additionally: '',
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        awardId: string | null;
    }>({ show: false, awardId: null });

    // Состояния для ошибок
    const [showError, setShowError] = useState(false);
    const [formErrors, setFormErrors] = useState<{
        placeTo?: string;
        moneyAmount?: string;
    }>({});

    // Метод валидации для использования через ref
    const validate = (): boolean => {
        const isValid = !required || awards.length > 0;
        setShowError(required && awards.length === 0);
        return isValid;
    };

    // Экспортируем метод через ref
    useImperativeHandle(ref, () => ({
        validate
    }));

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

    const handleChange = (field: keyof Omit<Award, 'id'>, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Очищаем ошибку поля при изменении
        if (formErrors[field as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const getNextAvailablePlace = (): number => {
        if (awards.length === 0) return 1;
        const sortedAwards = [...awards].sort((a, b) => a.placeFrom - b.placeFrom);
        return sortedAwards[sortedAwards.length - 1].placeTo + 1;
    };

    // Проверка, является ли награда последней
    const isLastAward = (award: Award): boolean => {
        if (awards.length === 0) return false;
        const sortedAwards = [...awards].sort((a, b) => a.placeFrom - b.placeFrom);
        return award.id === sortedAwards[sortedAwards.length - 1].id;
    };

    // Валидация формы с использованием объекта ошибок
    const validateForm = (): boolean => {
        const errors: { placeTo?: string; moneyAmount?: string } = {};
        let isValid = true;

        if (formData.placeTo < formData.placeFrom) {
            errors.placeTo = '"Место до" не может быть меньше "Место от"';
            isValid = false;
        }

        if (formData.moneyAmount < 0) {
            errors.moneyAmount = 'Денежная сумма не может быть отрицательной';
            isValid = false;
        }

        // При редактировании проверяем, чтобы не редактировались места для не-последних наград
        if (editingId) {
            // Находим текущую редактируемую награду
            const award = awards.find(a => a.id === editingId);
            if (!award) return false;

            // Если это не последняя награда, проверяем, что placeFrom и placeTo не изменились
            if (!isLastAward(award)) {
                const originalPlaceFrom = award.placeFrom;
                const originalPlaceTo = award.placeTo;

                // Проверяем только изменение мест, а не всех полей
                if (formData.placeFrom !== originalPlaceFrom || formData.placeTo !== originalPlaceTo) {
                    errors.placeTo = 'Для не-последней награды нельзя менять диапазон мест';
                    isValid = false;
                }
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const saveAward = () => {
        if (!validateForm()) return;

        const updatedAwards = editingId
            ? awards.map((a) =>
                a.id === editingId ? { ...formData, id: editingId } : a
            )
            : [...awards, { ...formData, id: Date.now().toString() }];

        // Сортируем по месту "от"
        updatedAwards.sort((a, b) => a.placeFrom - b.placeFrom);

        setAwards(updatedAwards);
        onChange(updatedAwards);

        // Если была ошибка (пустые награды) и теперь есть награды, скрываем ошибку
        if (showError && updatedAwards.length > 0) {
            setShowError(false);
        }

        resetForm();
    };

    const editAward = (award: Award) => {
        setEditingId(award.id);
        setFormData({
            placeFrom: award.placeFrom,
            placeTo: award.placeTo,
            moneyAmount: award.moneyAmount,
            additionally: award.additionally || '',
        });
        // Очищаем ошибки формы при выборе награды для редактирования
        setFormErrors({});
    };

    const deleteAward = () => {
        if (!deleteConfirm.awardId) return;

        // Находим удаляемую награду
        const sortedAwards = [...awards].sort((a, b) => a.placeFrom - b.placeFrom);
        const deletedIndex = sortedAwards.findIndex(a => a.id === deleteConfirm.awardId);

        if (deletedIndex === -1) {
            setDeleteConfirm({ show: false, awardId: null });
            return;
        }

        // Можно удалять только последнюю награду
        if (deletedIndex !== sortedAwards.length - 1) {
            setFormErrors({
                placeTo: "Можно удалять только последнюю награду. Сначала удалите все награды после неё."
            });
            setDeleteConfirm({ show: false, awardId: null });
            return;
        }

        // Удаляем награду
        const updatedAwards = awards.filter(a => a.id !== deleteConfirm.awardId);

        setAwards(updatedAwards);
        onChange(updatedAwards);

        setDeleteConfirm({ show: false, awardId: null });
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData(() => ({
            placeFrom: getNextAvailablePlace(),
            placeTo: getNextAvailablePlace(),
            moneyAmount: 0,
            additionally: ''
        }));
        setFormErrors({});
    };

    const formatPlace = (placeFrom: number, placeTo: number): string => {
        return placeFrom === placeTo
            ? `${placeFrom} место`
            : `${placeFrom}-${placeTo} места`;
    };

    const formatMoney = (amount: number): string => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>
                Награды
                {required && <span className={classes.required}>*</span>}
            </h3>

            {showError && (
                <div className={classes.errorMessage}>
                    Добавьте хотя бы одну награду
                </div>
            )}

            <div className={awards.length !== 0 ? classes.form : ""}>
                <div className={classes.placesRow}>
                    <div className={classes.placeInput}>
                        <Input
                            label="Место от"
                            type="number"
                            value={formData.placeFrom}
                            onChange={() => {}}
                            min={1}
                            disabled={true}
                        />
                        <div className={classes.inputHelperText}>
                            Устанавливается автоматически
                        </div>
                    </div>
                    <div className={classes.placeInput}>
                        <Input
                            label="Место до"
                            type="number"
                            value={formData.placeTo}
                            onChange={(e) => handleChange('placeTo', Number(e.target.value))}
                            min={formData.placeFrom}
                            disabled={!!editingId && !isLastAward({ ...formData, id: editingId } as Award)}
                            error={formErrors.placeTo}
                            required={!(!!editingId && !isLastAward({ ...formData, id: editingId } as Award))}
                            max={10000}
                        />
                    </div>
                </div>

                <div className={classes.inputContainer}>
                    <Input
                        label="Денежная сумма (₽)"
                        type="number"
                        value={formData.moneyAmount}
                        onChange={(e) => handleChange('moneyAmount', Number(e.target.value))}
                        min={0}
                        required
                        error={formErrors.moneyAmount}
                        max={1000000000}
                    />
                </div>

                <div className={classes.inputContainer}>
                    <Input
                        label="Дополнительно"
                        type="text"
                        value={formData.additionally}
                        onChange={(e) => handleChange('additionally', e.target.value)}
                        placeholder="Например, Бесплатный курс (необязательно)"
                        maxLength={255}
                    />
                </div>

                <div className={classes.actions}>
                    <Button
                        onClick={saveAward}
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
                                onClick={() => setDeleteConfirm({ show: true, awardId: editingId })}
                                className={classes.secondaryButton}
                                // Блокируем кнопку удаления для всех, кроме последней награды
                                disabled={!isLastAward({ ...formData, id: editingId } as Award)}
                            >
                                Удалить
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {awards.length > 0 && (
                <div className={classes.awardsHeader}>
                    <h4 className={classes.awardsListTitle}>Список наград</h4>
                    <div className={classes.awardsHelp}>
                        Для редактирования кликните на награду. Удалять можно только последнюю награду.
                    </div>
                </div>
            )}

            <div className={classes.awardsList}>
                {awards
                    .sort((a, b) => a.placeFrom - b.placeFrom)
                    .map((award) => (
                        <div
                            key={award.id}
                            className={`${classes.awardCard} ${
                                editingId === award.id ? classes.active : ''
                            } ${isLastAward(award) ? classes.lastAward : ''}`}
                            onClick={() => editAward(award)}
                        >
                            <div className={classes.awardPlace}>
                                {formatPlace(award.placeFrom, award.placeTo)}
                            </div>
                            <div className={classes.awardMoney}>
                                {formatMoney(award.moneyAmount)}
                            </div>
                            {award.additionally && (
                                <div className={classes.awardAdditionally}>
                                    {award.additionally}
                                </div>
                            )}
                            {!isLastAward(award) && editingId === award.id && (
                                <div className={classes.editingRestriction}>
                                    Для этой награды можно изменить только сумму и дополнения
                                </div>
                            )}
                        </div>
                    ))}
            </div>

            <Modal
                isOpen={deleteConfirm.show}
                onConfirm={deleteAward}
                onReject={() => setDeleteConfirm({ show: false, awardId: null })}
                confirmText="Удалить"
                rejectText="Отмена"
                title="Удалить награду?"
            >
                <p className={classes.modalText}>
                    Вы уверены, что хотите удалить эту награду? Это действие нельзя отменить.
                </p>
            </Modal>
        </div>
    );
});

export default AwardsEditor;