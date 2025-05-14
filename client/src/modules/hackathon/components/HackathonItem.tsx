// components/hackathon/HackathonItem.tsx
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import classes from '../hackathon.module.css';
import {HackathonShortInfo} from "../types.ts";
import ApiImage from "../../../components/apiImage/ApiImage.tsx";

interface HackathonItemProps {
    hackathon: HackathonShortInfo;
    onClick?: (id: number) => void;
}

const HackathonItem: React.FC<HackathonItemProps> = ({ hackathon, onClick }) => {
    const {
        id,
        name,
        organizationName,
        regDateFrom,
        regDateTo,
        workDateFrom,
        workDateTo,
        evalDateFrom,
        evalDateTo,
        logoId,
        technologies,
        totalAward,
        usersCount
    } = hackathon;

    // Функция форматирования даты
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return format(date, 'd MMM yyyy', { locale: ru });
        } catch {
            return 'Не указана';
        }
    };

    // Определение текущего статуса и этапа хакатона
    const { status, statusText, currentPhase, progress } = useMemo(() => {
        const now = new Date();
        const regStart = new Date(regDateFrom);
        const regEnd = new Date(regDateTo);
        const workStart = new Date(workDateFrom);
        const workEnd = new Date(workDateTo);
        const evalStart = new Date(evalDateFrom);
        const evalEnd = new Date(evalDateTo);

        let status: 'upcoming' | 'registration' | 'work' | 'evaluation' | 'finished';
        let statusText: string;
        let currentPhase = '';
        let progress = 0;

        if (now < regStart) {
            status = 'upcoming';
            statusText = 'Скоро начнется';
            currentPhase = 'Регистрация не открыта';
            progress = 0;
        } else if (now >= regStart && now <= regEnd) {
            status = 'registration';
            statusText = 'Регистрация';
            currentPhase = 'Этап регистрации';
            const totalRegTime = regEnd.getTime() - regStart.getTime();
            const elapsedRegTime = now.getTime() - regStart.getTime();
            progress = Math.min(25, Math.round((elapsedRegTime / totalRegTime) * 25));
        } else if (now > regEnd && now <= workEnd) {
            status = 'work';
            statusText = 'В процессе';
            currentPhase = 'Этап разработки';
            const totalWorkTime = workEnd.getTime() - workStart.getTime();
            const elapsedWorkTime = now.getTime() - workStart.getTime();
            progress = Math.min(75, 25 + Math.round((elapsedWorkTime / totalWorkTime) * 50));
        } else if (now > workEnd && now <= evalEnd) {
            status = 'evaluation';
            statusText = 'Оценка работ';
            currentPhase = 'Этап оценки';
            const totalEvalTime = evalEnd.getTime() - evalStart.getTime();
            const elapsedEvalTime = now.getTime() - evalStart.getTime();
            progress = Math.min(100, 75 + Math.round((elapsedEvalTime / totalEvalTime) * 25));
        } else {
            status = 'finished';
            statusText = 'Завершен';
            currentPhase = 'Хакатон завершен';
            progress = 100;
        }

        return { status, statusText, currentPhase, progress };
    }, [regDateFrom, regDateTo, workDateFrom, workDateTo, evalDateFrom, evalDateTo]);

    // Форматирование суммы наград
    const formattedAward = useMemo(() => {
        if (totalAward <= 0) return null;

        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(totalAward);
    }, [totalAward]);

    // Обработчик клика по карточке
    const handleClick = () => {
        if (onClick) onClick(id);
    };

    return (
        <div className={classes.card} onClick={handleClick}>
            {/* Верхняя часть с логотипом и названием */}
            <div className={classes.header}>
                <div className={classes.logoWrapper}>
                    <div className={classes.logoContainer}>
                        <ApiImage
                            fileId={logoId}
                            alt={`${name} логотип`}
                            className={classes.logo}
                            placeholderClassName={classes.placeholderLogo}
                            placeholderContent={name.substring(0, 3).toUpperCase()}
                        />
                    </div>
                </div>

                <div className={classes.titleArea}>
                    <h3 className={classes.title}>{name}</h3>
                    <p className={classes.organization}>{organizationName}</p>

                    {/* Шкала прогресса хакатона */}
                    <div className={classes.progressContainer}>
                        <div className={classes.progressLabel}>
                            <span>{currentPhase}</span>
                            <span className={classes.progressPercent}>{progress}%</span>
                        </div>
                        <div className={classes.progressBar}>
                            <div
                                className={`${classes.progressFill} ${classes[`progress_${status}`]}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Статус и призовой фонд */}
            <div className={classes.statusSection}>
                <div className={`${classes.statusBadge} ${classes[`status_${status}`]}`}>
                    {statusText}
                </div>

                {formattedAward && (
                    <div className={classes.awardBadge}>
                        <svg className={classes.awardIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
                                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {formattedAward}
                    </div>
                )}
            </div>

            {/* Блок с датами */}
            <div className={classes.datesSection}>
                <div className={classes.dateBlock}>
                    <span className={classes.dateIcon}>📝</span>
                    <div className={classes.dateContent}>
                        <h4 className={classes.dateTitle}>Регистрация</h4>
                        <p className={classes.dateRange}>{formatDate(regDateFrom)} — {formatDate(regDateTo)}</p>
                    </div>
                </div>

                <div className={classes.dateBlock}>
                    <span className={classes.dateIcon}>💻</span>
                    <div className={classes.dateContent}>
                        <h4 className={classes.dateTitle}>Разработка</h4>
                        <p className={classes.dateRange}>{formatDate(workDateFrom)} — {formatDate(workDateTo)}</p>
                    </div>
                </div>

                <div className={classes.dateBlock}>
                    <span className={classes.dateIcon}>🏆</span>
                    <div className={classes.dateContent}>
                        <h4 className={classes.dateTitle}>Подведение итогов</h4>
                        <p className={classes.dateRange}>{formatDate(evalDateFrom)} — {formatDate(evalDateTo)}</p>
                    </div>
                </div>
            </div>

            {/* Блок со статистикой */}
            <div className={classes.statsSection}>
                <div className={classes.statItem}>
                    <div className={classes.statIcon}>👥</div>
                    <div className={classes.statValue}>{usersCount}</div>
                    <div className={classes.statLabel}>Участников</div>
                </div>
            </div>

            {/* Технологии */}
            {technologies.length > 0 && (
                <div className={classes.techSection}>
                    <div className={classes.techList}>
                        {technologies.slice(0, 4).map((tech, index) => (
                            <div key={index} className={classes.techTag}>
                                {tech}
                            </div>
                        ))}
                        {technologies.length > 4 && (
                            <div className={classes.moreTechTag}>
                                +{technologies.length - 4}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HackathonItem;