import {useEffect, useState} from 'react';
import ParticipantsSection from "./components/ParticipantsSection.tsx";
import classes from './hackathon.module.css'
import TeamSection from "./components/TeamsSection.tsx";
import ChatSection from "./components/ChatsSection.tsx";
import ProjectsSection from "./components/ProjectsSection.tsx";
import {HackathonAPI} from "./hackathonAPI.ts";
import {useParams} from "react-router-dom";
import Loader from "../../components/loader/Loader.tsx";
import ValidateSection from "./components/ValidateSection.tsx";
import {HackathonInfo} from "./types.ts";
import ResultSection from "./components/ResultSection.tsx";

const HackathonDashboard = () => {
    const [activeTab, setActiveTab] = useState('participants');
    const [hackathonInfo, setHackathonInfo] = useState<HackathonInfo>({
        isWork: false,
        isRegistration: false,
        isEvaluation: false,
        role: 0
    })
    const [hackathonInfoLoading, setHackathonInfoLoading] = useState<boolean>(true)

    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;

    useEffect(() => {
        HackathonAPI.getMyRole(hackathonId)
            .then(info => {
                setHackathonInfo(info);
                if (info.role === 1 && (info.isEvaluation || info.isWork || info.isRegistration)) {
                    setActiveTab('participants');
                } else if (info.role > 1 && (info.isEvaluation || info.isWork || info.isRegistration)) {
                    setActiveTab('chats');
                } else {
                    setActiveTab('results')
                }
            })
            .finally(() => setHackathonInfoLoading(false));
    }, [hackathonId]);

    return (
        <div className={classes.page_wrapper}>
            {hackathonInfoLoading ? (
                <Loader/>
            ) : (
                <>
                    {hackathonInfo.role === 1 ? (
                            <>
                                <div className={classes.dashboard_tabs}>
                            {hackathonInfo.isRegistration &&
                                <>
                                <button
                                    className={`${classes.tab_button} ${activeTab === 'participants' ? classes.active : ''}`}
                                    onClick={() => setActiveTab('participants')}
                                >
                                    Участники
                                </button>
                                <button
                                    className={`${classes.tab_button} ${activeTab === 'teams' ? classes.active : ''}`}
                                    onClick={() => setActiveTab('teams')}
                                >
                                    Команда
                                </button>
                                </>
                            }
                            {(hackathonInfo.isEvaluation || hackathonInfo.isWork || hackathonInfo.isRegistration) &&
                                <button
                                    className={`${classes.tab_button} ${activeTab === 'chats' ? classes.active : ''}`}
                                    onClick={() => setActiveTab('chats')}
                                >
                                    Чаты
                                </button>
                            }
                            {hackathonInfo.isWork &&
                                <button
                                    className={`${classes.tab_button} ${activeTab === 'projects' ? classes.active : ''}`}
                                    onClick={() => setActiveTab('projects')}
                                >
                                    Загрузка проектов
                                </button>
                            }
                        </div>
                            </>
                    ) : (
                        <>

                        {(hackathonInfo.isEvaluation || hackathonInfo.isWork || hackathonInfo.isRegistration) ?
                            <>
                                <div className={classes.dashboard_tabs}>
                                    <button
                                        className={`${classes.tab_button} ${activeTab === 'chats' ? classes.active : ''}`}
                                        onClick={() => setActiveTab('chats')}
                                    >
                                        Чаты
                                    </button>
                                    <button
                                        className={`${classes.tab_button} ${activeTab === 'validate' ? classes.active : ''}`}
                                        onClick={() => setActiveTab('validate')}
                                    >
                                        Оценка проектов
                                    </button>

                                </div>
                            </>
                            :
                            <button
                                className={`${classes.tab_button} ${activeTab === 'results' ? classes.active : ''}`}
                                onClick={() => setActiveTab('results')}
                            >
                                Итоги
                            </button>
                        }

                        </>
                    )}

                    <div className={classes.dashboard_content}>
                        {hackathonInfo.role === 1 ? (
                            <>
                                {activeTab === 'participants' && <ParticipantsSection />}
                                {activeTab === 'teams' && <TeamSection />}
                                {activeTab === 'chats' && <ChatSection />}
                                {activeTab === 'projects' && <ProjectsSection />}
                                {activeTab === 'results' && <ResultSection />}
                            </>
                        ) : (
                            <>
                                {activeTab === 'chats' && <ChatSection />}
                                {activeTab === 'validate' && <ValidateSection />}
                                {activeTab === 'results' && <ResultSection />}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default HackathonDashboard;