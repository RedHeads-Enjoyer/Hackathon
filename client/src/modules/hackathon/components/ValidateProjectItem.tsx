import classes from '../hackathon.module.css';
import {ValidateCriteria, ValidateProject} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import {useState} from "react";
import Input from "../../../components/input/Input.tsx";
import TextArea from "../../../components/textArea/TextArea.tsx";
import {HackathonAPI} from "../hackathonAPI.ts";

type ValidateProjectItemProps = {
    project: ValidateProject;
    criteria: ValidateCriteria[];
    hackathonId: number;
    onUpdateRatings?: () => void;
};

const ValidateProjectItem = (props: ValidateProjectItemProps) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [isRatingLoading, setIsRatingLoading] = useState<boolean>(false);
    const [localCriteria, setLocalCriteria] = useState<ValidateCriteria[]>([...props.criteria]);

    // Обработчик изменения значения критерия
    const handleCriteriaValueChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedCriteria = [...localCriteria];
        const criterion = updatedCriteria[index];

        // Если строка пустая, сохраняем пустую строку
        if (e.target.value === '') {
            updatedCriteria[index] = {...criterion, value: 0};
        } else {
            // Иначе конвертируем в число и проверяем границы
            const numValue = parseInt(e.target.value);
            // Проверяем на минимальное и максимальное значение
            const validValue = Math.min(criterion.maxScore, Math.max(criterion.minScore, numValue));
            updatedCriteria[index] = {...criterion, value: validValue};
        }

        setLocalCriteria(updatedCriteria);
    };

    // Обработчик изменения комментария
    const handleCriteriaCommentChange = (index: number, comment: string) => {
        const updatedCriteria = [...localCriteria];
        updatedCriteria[index] = {...updatedCriteria[index], comment};
        setLocalCriteria(updatedCriteria);
    };

    // Отправка оценок
    const handleSubmitRatings = () => {
        setIsRatingLoading(true);

        // Здесь должен быть код отправки оценок на сервер
        // Например:
        HackathonAPI.submitProjectRatings(props.hackathonId, props.project.teamId, localCriteria)
            .then(() => {
                setExpanded(false);
                if (props.onUpdateRatings) props.onUpdateRatings();
            })
            .finally(() => {
                setIsRatingLoading(false);
            });

        // Временная имитация для демонстрации
        setTimeout(() => {
            setIsRatingLoading(false);
            setExpanded(false);
            if (props.onUpdateRatings) props.onUpdateRatings();
        }, 1000);
    };

    // Форматирование размера файла
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' ГБ';
    };

    // Функция для скачивания файла
    const downloadFile = async () => {
        try {
            // Используем API getBlobFile для получения содержимого файла
            const blob = await HackathonAPI.getBlobFile(props.project.project.id);

            // Создаем временную ссылку для скачивания
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = props.project.project.name;
            document.body.appendChild(a);
            a.click();

            // Очищаем память
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error("Ошибка при скачивании файла:", error);
            alert("Не удалось скачать файл");
        }
    };

    return (
        <div className={`${expanded ? classes.expandedCard : classes.card} ${classes.validateCard}`}>
            {/* Свернутый вид - только заголовок и статус */}
            <div
                className={classes.cardHeader}
                onClick={() => setExpanded(!expanded)}
            >
                <h3 className={classes.title}>{props.project.teamName}</h3>
                <div>
                    {props.project.summary !== null ? (
                        <span className={`${classes.status} ${classes.ratedStatus}`}>
                            {props.project.summary} баллов
                        </span>
                    ) : (
                        <span className={`${classes.status} ${classes.unratedStatus}`}>
                            Не оценено
                        </span>
                    )}
                </div>
            </div>

            {/* Развернутый вид - форма оценки */}
            {expanded && (
                <div className={classes.expandedFilters}>
                    {/* Информация о проекте */}
                    <div className={classes.fileContainer}>
                        {/* Кликабельная файлкарда для скачивания */}
                        <div
                            className={`${classes.fileCard} ${classes.downloadableFile}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                downloadFile();
                            }}
                        >
                            <div className={classes.fileInfo}>
                                <div className={classes.fileName}>{props.project.project.name}</div>
                                <div className={classes.fileSize}>{formatFileSize(props.project.project.size)}</div>
                            </div>
                            <div className={classes.fileDownload}>
                                <i className="fas fa-download"></i>
                            </div>
                        </div>
                    </div>

                    {/* Критерии оценки */}
                    <h4 className={classes.criteriaTitle}>Критерии оценки:</h4>

                    <div className={classes.criteriaContainer}>
                        {localCriteria.map((criterion, index) => (
                            <div
                                key={index}
                                className={`${classes.criterionCard} ${classes.criterionItem}`}
                            >
                                <h5 className={classes.criterionTitle}>{criterion.name}</h5>
                                <div className={classes.criterionScoreRange}>
                                    <span className={classes.criterionScore}>
                                        {criterion.minScore} - {criterion.maxScore} баллов
                                    </span>
                                </div>

                                <div className={classes.criterionInputs}>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <Input
                                            label={"Оценка"}
                                            type="number"
                                            min={criterion.minScore}
                                            max={criterion.maxScore}
                                            value={criterion.value === 0 || criterion.value ? criterion.value : ''}
                                            onChange={(e) => handleCriteriaValueChange(index, e)}
                                        />
                                    </div>

                                    <div onClick={(e) => e.stopPropagation()}>
                                        <TextArea
                                            label={"Комментарий"}
                                            value={criterion.comment || ''}
                                            onChange={(e) => handleCriteriaCommentChange(index, e.target.value)}
                                            placeholder="Комментарий к оценке..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Кнопки управления */}
                    <div className={classes.buttonsContainer}>
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(false);
                            }}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant={"primary"}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSubmitRatings();
                            }}
                            loading={isRatingLoading}
                            disabled={isRatingLoading}
                        >
                            Сохранить оценку
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ValidateProjectItem;