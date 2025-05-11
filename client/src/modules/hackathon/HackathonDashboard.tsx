import { useState } from 'react';
import ParticipantsSection from "./components/ParticipantsSection.tsx";
import classes from './hackathon.module.css'
import TeamSection from "./components/TeamsSection.tsx";
import ChatSection from "./components/ChatsSection.tsx";
import ProjectsSection from "./components/ProjectsSection.tsx";

const HackathonDashboard = () => {
    const [activeTab, setActiveTab] = useState('participants');

    return (
        <div className={classes.page_wrapper}>

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

            <div className={classes.dashboard_content}>
                {activeTab === 'participants' && <ParticipantsSection />}
                {activeTab === 'teams' && <TeamSection />}
                {activeTab === 'chats' && <ChatSection />}
                {activeTab === 'projects' && <ProjectsSection />}
            </div>
        </div>
    );
};

export default HackathonDashboard;