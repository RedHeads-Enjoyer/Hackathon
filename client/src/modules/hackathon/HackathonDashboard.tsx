import { useState } from 'react';
import ParticipantsSection from "./components/ParticipantsSection.tsx";
import classes from './hackathon.module.css'



const TeamsSection = () => (
    <div className="dashboard-section">
        <h2>Команды</h2>
        <div className="teams-list">
            <p>Здесь будет список команд хакатона</p>
            {/* Заглушка для списка команд */}
            <div className="team-card">
                <h3>Команда Alpha</h3>
                <p>5 участников</p>
                <div className="team-stack">
                    <span className="stack-tag">React</span>
                    <span className="stack-tag">Node.js</span>
                </div>
            </div>
            <div className="team-card">
                <h3>Команда Beta</h3>
                <p>4 участника</p>
                <div className="team-stack">
                    <span className="stack-tag">Vue</span>
                    <span className="stack-tag">Python</span>
                </div>
            </div>
            {/* Кнопка для создания новой команды */}
            <button className="add-button">+ Создать команду</button>
        </div>
    </div>
);

const ChatsSection = () => (
    <div className="dashboard-section">
        <h2>Чаты</h2>
        <div className="chats-container">
            <div className="chats-sidebar">
                <div className="chat-search">
                    <input type="text" placeholder="Поиск чатов..." />
                </div>
                <div className="chat-list">
                    <div className="chat-item active">
                        <h3>Общий чат</h3>
                        <p>Последнее сообщение...</p>
                    </div>
                    <div className="chat-item">
                        <h3>Команда Alpha</h3>
                        <p>Последнее сообщение...</p>
                    </div>
                    <div className="chat-item">
                        <h3>Техническая поддержка</h3>
                        <p>Последнее сообщение...</p>
                    </div>
                </div>
            </div>
            <div className="chat-messages">
                <div className="messages-container">
                    <p className="empty-chat-message">Выберите чат или создайте новый</p>
                </div>
                <div className="message-input">
                    <textarea placeholder="Введите сообщение..."></textarea>
                    <button>Отправить</button>
                </div>
            </div>
        </div>
    </div>
);

const ProjectsSection = () => (
    <div className="dashboard-section">
        <h2>Загрузка проектов</h2>
        <div className="projects-container">
            <div className="project-upload-area">
                <div className="upload-zone">
                    <i className="upload-icon">📁</i>
                    <p>Перетащите файлы сюда или нажмите для выбора</p>
                    <input type="file" multiple style={{ display: 'none' }} />
                    <button className="upload-button">Выбрать файлы</button>
                </div>
            </div>

            <div className="project-info-form">
                <h3>Информация о проекте</h3>
                <div className="form-group">
                    <label>Название проекта</label>
                    <input type="text" placeholder="Введите название проекта" />
                </div>
                <div className="form-group">
                    <label>Описание</label>
                    <textarea placeholder="Краткое описание проекта"></textarea>
                </div>
                <div className="form-group">
                    <label>Использованные технологии</label>
                    <input type="text" placeholder="Например: React, Node.js, MongoDB" />
                </div>
                <div className="form-group">
                    <label>Ссылка на репозиторий</label>
                    <input type="text" placeholder="https://github.com/username/project" />
                </div>
                <button className="submit-project">Отправить проект</button>
            </div>

            <div className="uploaded-projects">
                <h3>Загруженные проекты</h3>
                <div className="no-projects">
                    <p>У вас пока нет загруженных проектов</p>
                </div>
            </div>
        </div>
    </div>
);

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
                    Команды
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
                {activeTab === 'teams' && <TeamsSection />}
                {activeTab === 'chats' && <ChatsSection />}
                {activeTab === 'projects' && <ProjectsSection />}
            </div>
        </div>
    );
};

export default HackathonDashboard;