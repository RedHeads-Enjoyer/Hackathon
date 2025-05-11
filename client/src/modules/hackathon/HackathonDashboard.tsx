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

const HackathonDashboard = () => {
    const [activeTab, setActiveTab] = useState('participants');
    const [hackathonRole, setHackathonRole] = useState<number>(0)
    const [hackathonRoleLoading, setHackathonRoleLoading] = useState<boolean>(true)

    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;

    useEffect(() => {
        HackathonAPI.getMyRole(hackathonId)
            .then(role => {
                setHackathonRole(role);
                if (role === 1) {
                    setActiveTab('participants');
                } else {
                    setActiveTab('chats');
                }
            })
            .finally(() => setHackathonRoleLoading(false));
    }, [hackathonId]);

    return (
        <div className={classes.page_wrapper}>
            {hackathonRoleLoading ? (
                <Loader/>
            ) : (
                <>
                    {hackathonRole === 1 ? (
                        <div className={classes.dashboard_tabs}>
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
                            <button
                                className={`${classes.tab_button} ${activeTab === 'chats' ? classes.active : ''}`}
                                onClick={() => setActiveTab('chats')}
                            >
                                Чаты
                            </button>
                            <button
                                className={`${classes.tab_button} ${activeTab === 'projects' ? classes.active : ''}`}
                                onClick={() => setActiveTab('projects')}
                            >
                                Загрузка проектов
                            </button>
                        </div>
                    ) : (
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
                    )}

                    <div className={classes.dashboard_content}>
                        {hackathonRole === 1 ? (
                            <>
                                {activeTab === 'participants' && <ParticipantsSection />}
                                {activeTab === 'teams' && <TeamSection />}
                                {activeTab === 'chats' && <ChatSection />}
                                {activeTab === 'projects' && <ProjectsSection />}
                            </>
                        ) : (
                            <>
                                {activeTab === 'chats' && <ChatSection />}
                                {activeTab === 'validate' && <ValidateSection />}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default HackathonDashboard;