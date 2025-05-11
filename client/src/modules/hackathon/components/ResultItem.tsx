import { useState } from 'react';
import classes from '../hackathon.module.css';
import { Result } from '../types.ts';
import {HackathonAPI} from "../hackathonAPI.ts";

type ResultItemProps = {
    result: Result;
    maxScore: number;
    position: number;
};

const ResultItem = (props: ResultItemProps) => {
    const [expanded, setExpanded] = useState<boolean>(false);

    // Форматирование размера файла
    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' МБ';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' ГБ';
    };

    // Расчет процента от максимального балла
    const scorePercent = props.maxScore > 0
        ? Math.round((props.result.score / props.maxScore) * 100)
        : 0;

    // Определение класса индикатора прогресса в зависимости от процента
    const getProgressClass = () => {
        if (scorePercent >= 80) return classes.excellentProgress;
        if (scorePercent >= 60) return classes.goodProgress;
        if (scorePercent >= 40) return classes.mediumProgress;
        return classes.lowProgress;
    };

    // Функция для скачивания файла
    const downloadFile = async () => {
        try {
            const blob = await HackathonAPI.getBlobFile(props.result.project.id);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = props.result.project.name;
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
        <div className={`${expanded ? classes.expandedCard : classes.card} ${classes.validateCard}`}>
            <div
                className={classes.cardHeader}
                onClick={() => setExpanded(!expanded && props.result.project !== undefined)}
            >
                <h3 className={classes.title}>{props.position}. {props.result.teamName}</h3>
                <div>
                    <span className={`${classes.status} ${getProgressClass()}`}>
                        {props.result.project ? `${props.result.score} / ${props.maxScore}` : "Нет проекта"}
                    </span>
                </div>
            </div>

            {/* Развернутый вид с дополнительной информацией */}
            {expanded && (
                <div className={classes.expandedFilters}>
                    {/* Индикатор прогресса */}
                    <div className={classes.progressContainer}>
                        <div className={classes.progressBackground}>
                            <div
                                className={`${classes.progressBar} ${getProgressClass()}`}
                                style={{ width: `${scorePercent}%` }}
                            ></div>
                        </div>
                        <div className={classes.progressText}>
                            {scorePercent}% от максимального балла
                        </div>
                    </div>

                    {/* Информация о проекте */}
                    {props.result.project && (
                        <div className={classes.fileContainer}>
                            <h4 className={classes.sectionTitle}>Проект команды:</h4>
                            <div
                                className={`${classes.fileCard} ${classes.downloadableFile}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    downloadFile();
                                }}
                            >
                                <div className={classes.fileInfo}>
                                    <div className={classes.fileName}>{props.result.project.name}</div>
                                    <div className={classes.fileSize}>{formatFileSize(props.result.project.size)}</div>
                                </div>
                                <div className={classes.fileDownload}>
                                    <i className="fas fa-download"></i>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Информация о награде */}
                    {props.result.award && (
                        <div className={classes.awardContainer}>
                            <h4 className={classes.sectionTitle}>Награда:</h4>
                            <div className={classes.awardCard}>
                                {props.result.award.moneyAmount > 0 && (
                                    <div className={classes.moneyAmount}>
                                        <span className={classes.moneyLabel}>Денежный приз:</span>
                                        <span className={classes.moneyValue}>{props.result.award.moneyAmount.toLocaleString()} ₽</span>
                                    </div>
                                )}
                                {props.result.award.additionally && (
                                    <div className={classes.additionalAward}>
                                        <span className={classes.additionalLabel}>Дополнительно:</span>
                                        <span className={classes.additionalValue}>{props.result.award.additionally}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ResultItem;