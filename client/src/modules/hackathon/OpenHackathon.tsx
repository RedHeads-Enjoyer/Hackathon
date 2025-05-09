import classes from "./hackathon.module.css";
import { HackathonFullData } from "./types.ts";
import { useEffect, useState, useMemo } from "react";
import { hackathonAPI } from "./hackathonAPI.ts";
import Error from "../../components/error/Error.tsx";
import ApiImage from "../../components/apiImage/ApiImage.tsx";
import { useParams, useNavigate } from "react-router-dom";
import { HackathonRole, HackathonStatus } from "./storage.ts";
import { formatDate } from "date-fns";
import { ru } from 'date-fns/locale';
import Button from "../../components/button/Button.tsx";

const StatusBadge = ({ status }: { status: number }) => {
    let statusText = '';
    let statusClass = '';

    switch(status) {
        case HackathonStatus.PUBLISHED:
            statusText = 'Активный';
            statusClass = classes.statusActive;
            break;
        case HackathonStatus.DRAFT:
            statusText = 'Черновик';
            statusClass = classes.statusDraft;
            break;
        case HackathonStatus.ARCHIVED:
            statusText = 'Завершен';
            statusClass = classes.statusArchived;
            break;
        case HackathonStatus.BANNED:
            statusText = 'Заблокирован';
            statusClass = classes.statusBanned;
            break;
        default:
            statusText = 'Неизвестно';
            statusClass = classes.statusUnknown;
    }

    return <span className={`${classes.status} ${statusClass}`}>{statusText}</span>;
};

// Безопасное форматирование даты
export const safeFormatDate = (dateString: string | Date | null | undefined, formatStr: string = 'dd.MM.yyyy'): string => {
    if (!dateString) return 'не указано';

    try {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

        if (isNaN(date.getTime())) {
            return 'некорректная дата';
        }

        return formatDate(date, formatStr, { locale: ru });
    } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return 'некорректная дата';
    }
};

const OpenHackathon = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [hackathon, setHackathon] = useState<HackathonFullData | null>(null);
    const [loadingHackathon, setLoadingHackathon] = useState<boolean>(false);
    const [loadingHackathonError, setLoadingHackathonError] = useState<string | null>(null);
    const [registering, setRegistering] = useState<boolean>(false);

    useEffect(() => {
        setLoadingHackathon(true);
        setLoadingHackathonError(null);

        const hackathonId = id ? parseInt(id, 10) : 1;

        hackathonAPI.getFullById(hackathonId)
            .then((data) => {
                setHackathon(data);
            })
            .catch((err) => {
                const errorMessage = (err as Error).message || "Ошибка при загрузке хакатона";
                setLoadingHackathonError(errorMessage);
            })
            .finally(() => setLoadingHackathon(false));
    }, [id]);

    const handleFileDownload = async (fileId: number, fileName: string) => {
        try {
            // Показываем индикатор загрузки (опционально)
            // setDownloadingFile(fileId);

            // Получаем файл с сервера
            const blobData = await hackathonAPI.getBlobFile(fileId);

            // Создаем Blob URL для скачивания
            const blobUrl = window.URL.createObjectURL(new Blob([blobData]));

            // Создаем временный элемент <a>
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName); // Сохраняем оригинальное имя файла

            // Добавляем ссылку в DOM (нужно для работы в Safari)
            document.body.appendChild(link);

            // Эмулируем клик по ссылке
            link.click();

            // Удаляем ссылку из DOM
            document.body.removeChild(link);

            // Освобождаем ресурсы Blob URL
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
            }, 100);
        } catch (error) {
            console.error('Ошибка при загрузке файла:', error);
            alert('Не удалось загрузить файл. Попробуйте позже.');
        } finally {
            // Скрываем индикатор загрузки (опционально)
            // setDownloadingFile(null);
        }
    };

    // Определение статуса, фазы и прогресса хакатона
    const { phase, text, status, progress } = useMemo(() => {
        if (!hackathon) return { phase: '', text: '', status: '', progress: 0 };

        const now = new Date();
        const regStart = new Date(hackathon.regDateFrom);
        const regEnd = new Date(hackathon.regDateTo);
        const workStart = new Date(hackathon.workDateFrom);
        const workEnd = new Date(hackathon.workDateTo);
        const evalStart = new Date(hackathon.evalDateFrom);
        const evalEnd = new Date(hackathon.evalDateTo);

        let phase = '';
        let text = '';
        let status = '';
        let progress = 0;

        if (now < regStart) {
            phase = 'upcoming';
            text = 'Скоро открытие';
            status = 'upcoming';
            progress = 0;
        } else if (now >= regStart && now <= regEnd) {
            phase = 'registration';
            text = 'Идет регистрация';
            status = 'registration';
            const totalRegTime = regEnd.getTime() - regStart.getTime();
            const elapsedRegTime = now.getTime() - regStart.getTime();
            progress = Math.min(25, Math.round((elapsedRegTime / totalRegTime) * 25));
        } else if (now > regEnd && now < workStart) {
            phase = 'preparation';
            text = 'Подготовка к старту';
            status = 'registration';
            progress = 25;
        } else if (now >= workStart && now <= workEnd) {
            phase = 'development';
            text = 'Разработка проектов';
            status = 'development';
            const totalWorkTime = workEnd.getTime() - workStart.getTime();
            const elapsedWorkTime = now.getTime() - workStart.getTime();
            progress = Math.min(75, 25 + Math.round((elapsedWorkTime / totalWorkTime) * 50));
        } else if (now > workEnd && now < evalStart) {
            phase = 'submission';
            text = 'Прием работ';
            status = 'development';
            progress = 75;
        } else if (now >= evalStart && now <= evalEnd) {
            phase = 'evaluation';
            text = 'Оценка проектов';
            status = 'evaluation';
            const totalEvalTime = evalEnd.getTime() - evalStart.getTime();
            const elapsedEvalTime = now.getTime() - evalStart.getTime();
            progress = Math.min(100, 75 + Math.round((elapsedEvalTime / totalEvalTime) * 25));
        } else {
            phase = 'completed';
            text = 'Завершен';
            status = 'completed';
            progress = 100;
        }

        return { phase, text, status, progress };
    }, [hackathon]);

    const handleRegister = async () => {
        if (!hackathon) return;

        try {
            setRegistering(true);
            // Здесь должен быть вызов API для регистрации
            // Перезагружаем данные хакатона, чтобы обновить hackathonRole
            const updatedData = await hackathonAPI.getFullById(hackathon.id);
            setHackathon(updatedData);
            setRegistering(false);
        } catch (err) {
            console.error('Ошибка при регистрации:', err);
            setRegistering(false);
            alert('Не удалось зарегистрироваться на хакатон. Попробуйте позже.');
        }
    };

    const canRegister = () => {
        if (!hackathon || registering) return false;

        // Проверка роли пользователя (0 = не участник)
        if (hackathon.hackathonRole !== HackathonRole.NOT_PARTICIPANT) return false;

        // Проверка статуса хакатона (опубликован)
        if (hackathon.status !== HackathonStatus.PUBLISHED) return false;

        // Проверка текущей фазы (должна быть регистрация)
        return phase === 'registration';
    };

    if (loadingHackathon) {
        return (
            <div className={classes.loader}>
                <div className={classes.spinnerContainer}>
                    <div className={classes.spinner}></div>
                    <p>Загрузка информации о хакатоне...</p>
                </div>
            </div>
        );
    }

    if (loadingHackathonError) {
        return <Error>{loadingHackathonError}</Error>;
    }

    if (!hackathon) {
        return <Error>Хакатон не найден</Error>;
    }

    // Форматирование суммы призового фонда
    const formattedAward = new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(hackathon.totalAward);

    return (
        <div className={classes.pageWrapper}>
            {/* Верхняя полоса: три отдельных блока */}
            <div className={classes.topRow}>
                {/* Блок 1: Основная информация */}
                <div className={classes.block}>
                    <div className={classes.heroSection}>
                        <div className={classes.logoContainer}>
                            <ApiImage
                                fileId={hackathon.logoId}
                                alt={hackathon.name}
                                className={classes.logo}
                                placeholderContent={
                                    <div className={classes.logoPlaceholder}>
                                        {hackathon.name.substring(0, 2).toUpperCase()}
                                    </div>
                                }
                            />
                        </div>

                        <div className={classes.heroInfo}>
                            <div className={classes.titleRow}>
                                <h1 className={classes.title} title={hackathon.name}>
                                    {hackathon.name}
                                </h1>
                                <StatusBadge status={hackathon.status} />
                            </div>

                            <div className={classes.organizationInfo}>
                                <span className={classes.label}>Организатор:</span>
                                <span className={classes.organizationName}>{hackathon.organizationName}</span>
                            </div>

                            {/* Прогресс хакатона */}
                            <div className={classes.progressContainer}>
                                <div className={classes.progressLabel}>
                                    <span className={classes.progressPhase}>{text}</span>
                                    <span className={classes.progressPercent}>{progress}%</span>
                                </div>
                                <div className={classes.progressBar}>
                                    <div
                                        className={`${classes.progressFill} ${classes[`progress_${status}`]}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {hackathon.hackathonRole === HackathonRole.NOT_PARTICIPANT ? (
                                <div className={classes.registrationBlock}>
                                    <button
                                        className={classes.registerButton}
                                        disabled={!canRegister() || registering}
                                        onClick={handleRegister}
                                    >
                                        {registering ? 'Регистрация...' : 'Зарегистрироваться'}
                                    </button>
                                </div>
                            ) : (
                                <div className={classes.participantBlock}>
                                    <div className={classes.participantStatus}>
                                        {hackathon.hackathonRole === HackathonRole.PARTICIPANT && 'Вы — участник этого хакатона'}
                                        {hackathon.hackathonRole === HackathonRole.MENTOR && 'Вы — ментор этого хакатона'}
                                        {hackathon.hackathonRole === HackathonRole.OWNER && 'Вы — организатор этого хакатона'}
                                    </div>

                                    <Button
                                        variant={'secondary'}
                                        onClick={() => navigate(`/hackathon/${hackathon.id}/dashboard`)}
                                    >
                                        Управление
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Блок 2: Сроки */}
                <div className={classes.block}>
                    <div className={classes.datesBlock}>
                        <h2 className={classes.blockTitle}>Сроки проведения</h2>
                        <div className={classes.timeline}>
                            <div className={`${classes.timelineItem} ${phase === 'registration' ? classes.activePhase : ''}`}>
                                <div className={classes.timelineIcon}>1</div>
                                <div className={classes.timelineContent}>
                                    <h3 className={classes.timelineTitle}>Регистрация</h3>
                                    <div className={classes.timelineDates}>
                                        {safeFormatDate(hackathon.regDateFrom)} — {safeFormatDate(hackathon.regDateTo)}
                                    </div>
                                </div>
                            </div>

                            <div className={`${classes.timelineItem} ${phase === 'development' ? classes.activePhase : ''}`}>
                                <div className={classes.timelineIcon}>2</div>
                                <div className={classes.timelineContent}>
                                    <h3 className={classes.timelineTitle}>Разработка</h3>
                                    <div className={classes.timelineDates}>
                                        {safeFormatDate(hackathon.workDateFrom)} — {safeFormatDate(hackathon.workDateTo)}
                                    </div>
                                </div>
                            </div>

                            <div className={`${classes.timelineItem} ${phase === 'evaluation' ? classes.activePhase : ''}`}>
                                <div className={classes.timelineIcon}>3</div>
                                <div className={classes.timelineContent}>
                                    <h3 className={classes.timelineTitle}>Оценка</h3>
                                    <div className={classes.timelineDates}>
                                        {safeFormatDate(hackathon.evalDateFrom)} — {safeFormatDate(hackathon.evalDateTo)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Блок 3: Статистика */}
                <div className={classes.block}>
                    <div className={classes.statsBlock}>
                        <h2 className={classes.blockTitle}>Ключевая информация</h2>
                        <div className={classes.statsContainer}>
                            <div className={classes.statItem}>
                                <div className={classes.statIcon}>👥</div>
                                <div className={classes.statContent}>
                                    <div className={classes.statValue}>{hackathon.usersCount}</div>
                                    <div className={classes.statLabel}>Участников</div>
                                </div>
                            </div>

                            <div className={classes.statItem}>
                                <div className={classes.statIcon}>👨‍💻</div>
                                <div className={classes.statContent}>
                                    <div className={classes.statValue}>
                                        {hackathon.minTeamSize === hackathon.maxTeamSize
                                            ? `${hackathon.minTeamSize}`
                                            : `${hackathon.minTeamSize}-${hackathon.maxTeamSize}`}
                                    </div>
                                    <div className={classes.statLabel}>Размер команды</div>
                                </div>
                            </div>

                            <div className={classes.statItem}>
                                <div className={classes.statIcon}>🏆</div>
                                <div className={classes.statContent}>
                                    <div className={classes.statValue}>{formattedAward}</div>
                                    <div className={classes.statLabel}>Призовой фонд</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Вторая линия: Технологии */}
            <div className={classes.technologiesSection}>
                <h2 className={classes.sectionTitle}>Технологии</h2>
                <div className={classes.technologiesContainer}>
                    {hackathon.technologies.length > 0 ? (
                        <div className={classes.tagsList}>
                            {hackathon.technologies.map(tech => (
                                <span key={tech.id} className={classes.tag}>{tech.name}</span>
                            ))}
                        </div>
                    ) : (
                        <p className={classes.emptyState}>Технологии не указаны</p>
                    )}
                </div>
            </div>

            {/* ПЕРВАЯ ЛИНИЯ: О хакатоне и Призы */}
            <div className={classes.infoLine}>
                {/* Описание хакатона */}
                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>О хакатоне</h2>
                    <div className={classes.description}>
                        {hackathon.description || 'Описание не предоставлено'}
                    </div>
                </div>

                {/* Призы */}
                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>Призы</h2>
                    {hackathon.awards.length > 0 ? (
                        <div className={classes.awardsList}>
                            {hackathon.awards.map(award => (
                                <div key={award.id} className={classes.awardCard}>
                                    <div className={classes.awardPlace}>
                                        {award.placeFrom === award.placeTo
                                            ? `${award.placeFrom} место`
                                            : `${award.placeFrom}–${award.placeTo} места`}
                                    </div>
                                    <div className={classes.awardAmount}>
                                        {new Intl.NumberFormat('ru-RU', {
                                            style: 'currency',
                                            currency: 'RUB',
                                            maximumFractionDigits: 0
                                        }).format(award.moneyAmount)}
                                    </div>
                                    {award.additionally && (
                                        <div className={classes.awardAdditional}>{award.additionally}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={classes.emptyState}>Информация о призах не предоставлена</p>
                    )}
                </div>
            </div>

            {/* ВТОРАЯ ЛИНИЯ: Этапы хакатона на всю ширину */}
            {hackathon.steps.length > 0 && (
                <div className={classes.stepsSection}>
                    <div className={classes.section}>
                        <h2 className={classes.sectionTitle}>Этапы хакатона</h2>
                        <div className={classes.stepsContainer}>
                            {hackathon.steps.map((step, index) => (
                                <div key={step.id} className={classes.stepCard}>
                                    <div className={classes.stepHeader}>
                                        <div className={classes.stepNumber}>{index + 1}</div>
                                        <h3 className={classes.stepTitle}>{step.name}</h3>
                                        <div className={classes.stepDates}>
                                            {safeFormatDate(step.startDate)} — {safeFormatDate(step.endDate)}
                                        </div>
                                    </div>
                                    {step.description && (
                                        <div className={classes.stepDescription}>{step.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ТРЕТЬЯ ЛИНИЯ: Критерии оценки и Материалы */}
            <div className={classes.criteriaFilesLine}>
                {/* Критерии оценки */}
                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>Критерии оценки</h2>
                    {hackathon.criteria.length > 0 ? (
                        <div className={classes.criteriaContainer}>
                            {hackathon.criteria.map(criterion => (
                                <div key={criterion.id} className={classes.criterionCard}>
                                    <h3 className={classes.criterionTitle}>{criterion.name}</h3>
                                    <div className={classes.criterionScore}>
                                        {criterion.minScore} — {criterion.maxScore} баллов
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={classes.emptyState}>Критерии не указаны</p>
                    )}
                </div>

                {/* Файлы/Материалы */}
                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>Материалы</h2>
                    {hackathon.files.length > 0 ? (
                        <div className={classes.filesContainer}>
                            {hackathon.files.map(file => (
                                <div key={file.id} className={classes.fileCard} onClick={() =>handleFileDownload(file.id, file.name)}>
                                    <div className={classes.fileIcon}>
                                        {file.type.includes('image') ? '🖼️' :
                                            file.type.includes('pdf') ? '📄' :
                                                file.type.includes('word') ? '📝' :
                                                    file.type.includes('excel') ? '📊' : '📁'}
                                    </div>
                                    <div className={classes.fileInfo}>
                                        <div className={classes.fileName}>{file.name}</div>
                                        <div className={classes.fileSize}>
                                            {(file.size / 1024 / 1024).toFixed(2)} МБ
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className={classes.emptyState}>Материалы не загружены</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpenHackathon;