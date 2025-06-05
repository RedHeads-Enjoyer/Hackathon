import classes from '../hackathon.module.css';
import {ValidateCriteria, ValidateProject} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import {useState, useEffect} from "react";
import Input from "../../../components/input/Input.tsx";
import TextArea from "../../../components/textArea/TextArea.tsx";
import {HackathonAPI} from "../hackathonAPI.ts";
import Modal from "../../../components/modal/Modal.tsx";

type ValidateProjectItemProps = {
    project: ValidateProject;
    hackathonId: number;
    onUpdateRatings?: () => void;
    maxScore: number;
};

// Структура для хранения ошибок по индексам критериев
type CriteriaErrors = {
    [index: number]: { comment?: string }
};

const ValidateProjectItem = (props: ValidateProjectItemProps) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const [isRatingLoading, setIsRatingLoading] = useState<boolean>(false);
    const [localCriteria, setLocalCriteria] = useState<ValidateCriteria[]>([...props.project.criteria]);
    const [localSummary, setLocalSummary] = useState<number | null>(props.project.summary);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [errors, setErrors] = useState<CriteriaErrors>({});

    // Обновляем локальные данные при изменении props
    useEffect(() => {
        setLocalCriteria([...props.project.criteria]);
        setLocalSummary(props.project.summary);
        setErrors({});
    }, [props.project.criteria, props.project.summary]);

    // Обработчик изменения значения критерия
    const handleCriteriaValueChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const updatedCriteria = [...localCriteria];
        const criterion = updatedCriteria[index];

        if (e.target.value === '') {
            updatedCriteria[index] = {...criterion, value: 0};
        } else {
            const numValue = parseInt(e.target.value);
            updatedCriteria[index] = {...criterion, value: numValue};
        }

        setLocalCriteria(updatedCriteria);
    };

    // Обработчик изменения комментария
    const handleCriteriaCommentChange = (index: number, comment: string) => {
        const updatedCriteria = [...localCriteria];
        updatedCriteria[index] = {...updatedCriteria[index], comment};
        setLocalCriteria(updatedCriteria);

        // Если комментарий не пустой, убираем ошибку
        if (comment.trim() && errors[index]?.comment) {
            const newErrors = {...errors};
            delete newErrors[index];
            setErrors(newErrors);
        }
    };

    // Валидация перед отправкой
    const validateCriteria = (): boolean => {
        const newErrors: CriteriaErrors = {};
        let isValid = true;

        localCriteria.forEach((criterion, index) => {
            // Проверяем, есть ли комментарий
            if (!criterion.comment || criterion.comment.trim() === '') {
                newErrors[index] = { comment: 'Необходимо добавить комментарий' };
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // Проверка перед отправкой оценок
    const checkAndSubmitRatings = () => {
        // Сначала валидируем
        if (!validateCriteria()) {
            return; // Если есть ошибки, прерываем отправку
        }

        // Если проект уже был оценен, показываем подтверждение
        if (props.project.summary !== null) {
            setIsModalOpen(true);
        } else {
            // Иначе сразу отправляем оценки
            submitRatings();
        }
    };

    // Отправка оценок
    const submitRatings = () => {
        setIsRatingLoading(true);
        setIsModalOpen(false);

        HackathonAPI.submitProjectRatings(props.hackathonId, props.project.teamId, localCriteria)
            .then((response) => {
                // Если сервер вернул обновленную сумму баллов, обновляем локальное состояние
                if (response && response.summary !== undefined) {
                    setLocalSummary(response.summary);
                } else {
                    // Если сервер не вернул сумму, вычисляем примерную сумму локально
                    const sum = localCriteria.reduce((acc, criterion) =>
                        acc + (criterion.value || 0), 0);
                    setLocalSummary(sum);
                }

                // Закрываем развернутый вид
                setExpanded(false);

                // Сбрасываем ошибки
                setErrors({});

                // Вызываем колбэк для обновления данных в родительском компоненте
                if (props.onUpdateRatings) {
                    props.onUpdateRatings();
                }
            })
            .catch((error) => {
                console.error("Ошибка при сохранении оценок:", error);
                alert("Не удалось сохранить оценки. Пожалуйста, попробуйте снова.");
            })
            .finally(() => {
                setIsRatingLoading(false);
            });
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
            const blob = await HackathonAPI.getBlobFile(props.project.project.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = props.project.project.name;
            document.body.appendChild(a);
            a.click();

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
        <>
            <div className={`${expanded ? classes.expandedCard : classes.card} ${classes.validateCard}`}>
                {/* Свернутый вид - только заголовок и статус */}
                <div
                    className={classes.cardHeader}
                    onClick={() => setExpanded(!expanded)}
                >
                    <h3 className={classes.title}>{props.project.teamName}</h3>
                    <div>
                        {localSummary !== null ? (
                            <span className={`${classes.status} ${classes.ratedStatus}`}>
                                {localSummary} / {props.maxScore}
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
                                                error={errors[index]?.comment}
                                                maxLength={1000}
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
                                    checkAndSubmitRatings();
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

            {/* Модальное окно подтверждения */}
            <Modal
                isOpen={isModalOpen}
                onConfirm={submitRatings}
                onReject={() => setIsModalOpen(false)}
                title="Обновление оценки"
                rejectText="Отмена"
                confirmText="Подтвердить"
            >
                <p>
                    Вы уверены, что хотите изменить свою оценку?
                </p>
            </Modal>
        </>
    );
};

export default ValidateProjectItem;