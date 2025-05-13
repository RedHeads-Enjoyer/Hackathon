import { useState, useId, forwardRef, useImperativeHandle } from 'react';
import classes from './style.module.css';
import Modal from '../modal/Modal';
import SearchSelect from "../searchSelect/SearchSelect.tsx";
import {Option} from "../../modules/organozaton/types.ts";

// Интерфейс для ref
export interface TechnologyStackInputRef {
    validate: () => boolean;
}

interface TechnologyStackInputProps {
    initialTechnologies?: Array<Option>;
    onChange: (technologies: Array<Option>) => void;
    required?: boolean;
}

const TechnologyStackInput = forwardRef<TechnologyStackInputRef, TechnologyStackInputProps>(({
                                                                                                 initialTechnologies = [],
                                                                                                 onChange,
                                                                                                 required = false
                                                                                             }, ref) => {
    const [technologies, setTechnologies] = useState<Array<Option>>(initialTechnologies);
    const [showError, setShowError] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        techToDelete: Option | null;
    }>({ show: false, techToDelete: null });

    const idGenerator = useId();

    // Метод валидации для использования через ref
    const validate = (): boolean => {
        const isValid = !required || technologies.length > 0;
        setShowError(required && technologies.length === 0);
        return isValid;
    };

    // Экспортируем метод через ref
    useImperativeHandle(ref, () => ({
        validate
    }));

    const addTechnology = (option: Option) => {
        // Check if technology already exists
        if (!technologies.some(tech => tech.value === option.value)) {
            const updatedTechs = [...technologies, option];
            setTechnologies(updatedTechs);
            onChange(updatedTechs);

            if (showError) {
                setShowError(false);
            }
        }
    };

    const requestDeleteTechnology = (tech: Option) => {
        setDeleteConfirm({ show: true, techToDelete: tech });
    };

    const deleteTechnology = () => {
        if (!deleteConfirm.techToDelete) return;

        // Store in a variable to help TypeScript understand it's not null
        const techToDelete = deleteConfirm.techToDelete;

        const updatedTechs = technologies.filter(
            tech => tech.value !== techToDelete.value
        );
        setTechnologies(updatedTechs);
        onChange(updatedTechs);

        setDeleteConfirm({ show: false, techToDelete: null });
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>
                Стек технологий
                {required && <span className={classes.required}>*</span>}
            </h3>

            {showError && (
                <div className={classes.errorMessage}>
                    Добавьте хотя бы одну технологию
                </div>
            )}

            <div className={technologies.length !== 0 ? classes.form : ""}>
                <div className={classes.inputContainer}>
                    <SearchSelect
                        label={"Выберите технологию"}
                        url={"/technology/options"}
                        onChange={addTechnology}
                        notFound={<p>Технология не найдена.</p>}
                        placeholder={"Введите название технологии"}
                        clearable={true}
                    />
                </div>
            </div>

            {technologies.length > 0 && (
                <div className={classes.techHeader}>
                    <h4 className={classes.techListTitle}>Список технологий</h4>
                    <div className={classes.techHelp}>
                        Для удаления технологии кликните на неё
                    </div>
                </div>
            )}

            {technologies.length > 0 && (
                <div className={classes.techList}>
                    {technologies.map((tech) => (
                        <div
                            key={`${idGenerator}-${tech.value}`}
                            className={classes.techItem}
                            onClick={() => requestDeleteTechnology(tech)}
                        >
                            {tech.label}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={deleteConfirm.show}
                onConfirm={deleteTechnology}
                onReject={() => setDeleteConfirm({ show: false, techToDelete: null })}
                confirmText="Удалить"
                rejectText="Отмена"
                title="Удалить технологию?"
            >
                <p>
                    Вы уверены, что хотите удалить "{deleteConfirm.techToDelete?.label}" из списка?
                </p>
            </Modal>
        </div>
    );
});

export default TechnologyStackInput;