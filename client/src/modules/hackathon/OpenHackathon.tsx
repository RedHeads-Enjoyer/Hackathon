import classes from "./hackathon.module.css";
import { HackathonFullData } from "./types.ts";
import { useEffect, useState } from "react";
import { hackathonAPI } from "./hackathonAPI.ts";
import Error from "../../components/error/Error.tsx";
import ApiImage from "../../components/apiImage/ApiImage.tsx";
import { useParams, useNavigate } from "react-router-dom";
import {HackathonRole, HackathonStatus } from "./storage.ts";
import { formatDate } from "date-fns";

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

// Определение текущей фазы хакатона
const getCurrentPhase = (hackathon: HackathonFullData) => {
    const now = new Date();
    const regFrom = new Date(hackathon.regDateFrom);
    const regTo = new Date(hackathon.regDateTo);
    const workFrom = new Date(hackathon.workDateFrom);
    const workTo = new Date(hackathon.workDateTo);
    const evalFrom = new Date(hackathon.evalDateFrom);
    const evalTo = new Date(hackathon.evalDateTo);

    if (now < regFrom) {
        return { phase: 'upcoming', text: 'Скоро открытие' };
    } else if (now >= regFrom && now <= regTo) {
        return { phase: 'registration', text: 'Идет регистрация' };
    } else if (now > regTo && now < workFrom) {
        return { phase: 'preparation', text: 'Подготовка к старту' };
    } else if (now >= workFrom && now <= workTo) {
        return { phase: 'development', text: 'Разработка проектов' };
    } else if (now > workTo && now < evalFrom) {
        return { phase: 'submission', text: 'Прием работ' };
    } else if (now >= evalFrom && now <= evalTo) {
        return { phase: 'evaluation', text: 'Оценка проектов' };
    } else {
        return { phase: 'completed', text: 'Завершен' };
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

    const handleRegister = async () => {
        if (!hackathon) return;

        try {
            setRegistering(true);
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
        const { phase } = getCurrentPhase(hackathon);
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

    const currentPhase = getCurrentPhase(hackathon);

    // Расчет общего призового фонда
    const totalPrize = hackathon.totalAward;

    return (
        <div className={classes.pageWrapper}>
            {/* Шапка хакатона */}
            <div className={classes.heroSection}>
                <div className={classes.heroContent}>
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
                            <h1 className={classes.title}>{hackathon.name}</h1>
                            <StatusBadge status={hackathon.status} />
                        </div>

                        <div className={classes.organizationInfo}>
                            <span className={classes.label}>Организатор:</span> {hackathon.organizationName}
                        </div>

                        <div className={classes.phaseIndicator}>
              <span className={`${classes.phaseLabel} ${classes[`phase_${currentPhase.phase}`]}`}>
                {currentPhase.text}
              </span>
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
                                {!canRegister() && currentPhase.phase !== 'registration' && (
                                    <p className={classes.registrationNote}>
                                        Регистрация {currentPhase.phase === 'upcoming' ? 'ещё не началась' : 'уже завершена'}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className={classes.participantBlock}>
                                <div className={classes.participantStatus}>
                                    {hackathon.hackathonRole === HackathonRole.PARTICIPANT && 'Вы — участник этого хакатона'}
                                    {hackathon.hackathonRole === HackathonRole.MENTOR && 'Вы — ментор этого хакатона'}
                                    {hackathon.hackathonRole === HackathonRole.OWNER && 'Вы — организатор этого хакатона'}
                                </div>

                                <button
                                    className={classes.dashboardButton}
                                    onClick={() => navigate(`/hackathon/${hackathon.id}/dashboard`)}
                                >
                                    Перейти в личный кабинет
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Основная информация */}
            <div className={classes.contentContainer}>
                {/* Описание и сроки */}
                <div className={classes.mainSection}>
                    <div className={classes.descriptionSection}>
                        <h2 className={classes.sectionTitle}>О хакатоне</h2>
                        <div className={classes.description}>
                            {hackathon.description || 'Описание не предоставлено'}
                        </div>
                    </div>

                    <div className={classes.datesSection}>
                        <h2 className={classes.sectionTitle}>Сроки проведения</h2>

                        <div className={classes.timeline}>
                            <div className={`${classes.timelineItem} ${currentPhase.phase === 'registration' ? classes.activePhase : ''}`}>
                                <div className={classes.timelineIcon}>1</div>
                                <div className={classes.timelineContent}>
                                    <h3 className={classes.timelineTitle}>Регистрация</h3>
                                    <div className={classes.timelineDates}>
                                        {formatDate(hackathon.regDateFrom)} — {formatDate(hackathon.regDateTo)}
                                    </div>
                                </div>
                            </div>

                            <div className={`${classes.timelineItem} ${currentPhase.phase === 'development' ? classes.activePhase : ''}`}>
                                <div className={classes.timelineIcon}>2</div>
                                <div className={classes.timelineContent}>
                                    <h3 className={classes.timelineTitle}>Разработка</h3>
                                    <div className={classes.timelineDates}>
                                        {formatDate(hackathon.workDateFrom)} — {formatDate(hackathon.workDateTo)}
                                    </div>
                                </div>
                            </div>

                            <div className={`${classes.timelineItem} ${currentPhase.phase === 'evaluation' ? classes.activePhase : ''}`}>
                                <div className={classes.timelineIcon}>3</div>
                                <div className={classes.timelineContent}>
                                    <h3 className={classes.timelineTitle}>Оценка проектов</h3>
                                    <div className={classes.timelineDates}>
                                        {formatDate(hackathon.evalDateFrom)} — {formatDate(hackathon.evalDateTo)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Раздел с технологиями */}
                <div className={classes.secondarySection}>
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

                {/* Раздел с наградами */}
                <div className={classes.prizesSection}>
                    <h2 className={classes.sectionTitle}>Призовой фонд</h2>

                    <div className={classes.prizesContainer}>
                        <div className={classes.totalPrize}>
              <span className={classes.totalPrizeAmount}>
                {new Intl.NumberFormat('ru-RU', {
                    style: 'currency',
                    currency: 'RUB',
                    maximumFractionDigits: 0
                }).format(totalPrize)}
              </span>
                            <span className={classes.totalPrizeLabel}>Общий призовой фонд</span>
                        </div>

                        <div className={classes.awardsList}>
                            {hackathon.awards.map(award => (
                                <div key={award.id} className={classes.awardCard}>
                                    <div className={classes.awardPlace}>
                                        {award.placeFrom === award.placeTo
                                            ? `${award.placeFrom} место`
                                            : `${award.placeFrom}-${award.placeTo} места`}
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
                    </div>
                </div>

                {/* Условия участия */}
                <div className={classes.conditionsSection}>
                    <h2 className={classes.sectionTitle}>Условия участия</h2>

                    <div className={classes.conditionsContainer}>
                        <div className={classes.conditionCard}>
                            <div className={classes.conditionIcon}>👥</div>
                            <div className={classes.conditionContent}>
                                <h3 className={classes.conditionTitle}>Размер команды</h3>
                                <div className={classes.conditionValue}>
                                    {hackathon.minTeamSize === hackathon.maxTeamSize
                                        ? `${hackathon.minTeamSize} человек`
                                        : `От ${hackathon.minTeamSize} до ${hackathon.maxTeamSize} человек`}
                                </div>
                            </div>
                        </div>

                        <div className={classes.conditionCard}>
                            <div className={classes.conditionIcon}>👨‍💻</div>
                            <div className={classes.conditionContent}>
                                <h3 className={classes.conditionTitle}>Участников</h3>
                                <div className={classes.conditionValue}>
                                    {hackathon.usersCount} человек
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Раздел с этапами */}
                {hackathon.steps.length > 0 && (
                    <div className={classes.stepsSection}>
                        <h2 className={classes.sectionTitle}>Этапы хакатона</h2>

                        <div className={classes.stepsContainer}>
                            {hackathon.steps.map((step, index) => (
                                <div key={step.id} className={classes.stepCard}>
                                    <div className={classes.stepHeader}>
                                        <div className={classes.stepNumber}>{index + 1}</div>
                                        <h3 className={classes.stepTitle}>{step.name}</h3>
                                    </div>

                                    <div className={classes.stepDates}>
                                        {formatDate(step.startDate)} — {formatDate(step.endDate)}
                                    </div>

                                    {step.description && (
                                        <div className={classes.stepDescription}>{step.description}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Критерии оценки */}
                {hackathon.criteria.length > 0 && (
                    <div className={classes.criteriaSection}>
                        <h2 className={classes.sectionTitle}>Критерии оценки</h2>

                        <div className={classes.criteriaContainer}>
                            {hackathon.criteria.map(criterion => (
                                <div key={criterion.id} className={classes.criterionCard}>
                                    <h3 className={classes.criterionTitle}>{criterion.name}</h3>
                                    <div className={classes.criterionScore}>
                                        {criterion.minScore} - {criterion.maxScore} баллов
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Файлы */}
                {hackathon.files.length > 0 && (
                    <div className={classes.filesSection}>
                        <h2 className={classes.sectionTitle}>Материалы</h2>

                        <div className={classes.filesContainer}>
                            {hackathon.files.map(file => (
                                <div key={file.id} className={classes.fileCard} onClick={() => hackathonAPI.getBlobFile(file.id)}>
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
                                    <div className={classes.fileDownload}>⬇️</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OpenHackathon;