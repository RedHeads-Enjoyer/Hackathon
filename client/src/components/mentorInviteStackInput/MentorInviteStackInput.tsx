import {useEffect, useId, useState} from 'react';
import classes from './styles.module.css';
import Modal from '../modal/Modal';
import SearchSelect from "../searchSelect/SearchSelect.tsx";
import {Option} from "../../modules/organozaton/types.ts";

// Интерфейс для приглашения ментора
interface MentorInvite {
    id: number;
    username: string;
    status: number;
}

// Интерфейс для нового приглашения (еще не сохранено на сервере)
interface NewMentorInvite {
    username: string;
    userId: number; // ID пользователя для создания приглашения
}

interface MentorInviteStackInputProps {
    mentorInvites?: Array<MentorInvite>;
    onChange: (mentorInvites: Array<NewMentorInvite>, mentorInvitesToDelete: Array<number>) => void;
    required?: boolean;
}

const MentorInviteStackInput = (({
                                     mentorInvites = [],
                                     onChange,
                                     required = false
                                 }: MentorInviteStackInputProps) => {
    // Состояние для хранения существующих приглашений
    const [existingInvites, setExistingInvites] = useState<Array<MentorInvite>>(mentorInvites);

    // Состояние для хранения новых приглашений
    const [newInvites, setNewInvites] = useState<Array<NewMentorInvite>>([]);

    // Состояние для хранения ID приглашений, которые нужно удалить
    const [invitesToDelete, setInvitesToDelete] = useState<Array<number>>([]);

    // Модальное окно подтверждения удаления
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        invite: MentorInvite | NewMentorInvite | null;
        isExisting: boolean;
    }>({show: false, invite: null, isExisting: false});

    const idGenerator = useId();

    // Обновляем родительский компонент при изменении списков
    useEffect(() => {
        onChange(newInvites, invitesToDelete);
    }, [newInvites, invitesToDelete, onChange]);

    // Инициализация при изменении входящих данных
    useEffect(() => {
        if (mentorInvites && mentorInvites.length > 0) {
            setExistingInvites(mentorInvites);
        }
    }, [mentorInvites]);

    // Добавление нового приглашения
    const addMentorInvite = (option: Option) => {
        // Проверяем, не добавлен ли уже этот пользователь
        const alreadyExists =
            existingInvites.some(invite => invite.username === option.label) ||
            newInvites.some(invite => invite.username === option.label);

        if (!alreadyExists) {
            const newInvite: NewMentorInvite = {
                username: option.label,
                userId: Number(option.value)
            };

            setNewInvites(prev => [...prev, newInvite]);
        }
    };

    // Запрос на удаление приглашения
    const requestDeleteInvite = (invite: MentorInvite | NewMentorInvite, isExisting: boolean) => {
        setDeleteConfirm({
            show: true,
            invite,
            isExisting
        });
    };

    // Подтверждение удаления приглашения
    const deleteInvite = () => {
        if (!deleteConfirm.invite) return;

        if (deleteConfirm.isExisting) {
            // Для существующего приглашения добавляем ID в список на удаление
            const existingInvite = deleteConfirm.invite as MentorInvite;
            setInvitesToDelete(prev => [...prev, existingInvite.id]);

            // Удаляем из списка отображаемых приглашений
            setExistingInvites(prev =>
                prev.filter(invite => invite.id !== existingInvite.id)
            );
        } else {
            // Для нового приглашения просто удаляем из списка
            const newInvite = deleteConfirm.invite as NewMentorInvite;
            setNewInvites(prev =>
                prev.filter(invite => invite.username !== newInvite.username)
            );
        }

        // Закрываем модальное окно
        setDeleteConfirm({show: false, invite: null, isExisting: false});
    };

    // Преобразование статуса в текст
    const getStatusText = (status: number) => {
        switch(status) {
            case 0: return "Ожидает";
            case 1: return "Принято";
            case 2: return "Отклонено";
            default: return "Неизвестно";
        }
    };

    // Получаем цвет статуса
    const getStatusColor = (status: number) => {
        switch(status) {
            case 0: return "#f39c12"; // Оранжевый для ожидания
            case 1: return "#2ecc71"; // Зеленый для принятых
            case 2: return "#e74c3c"; // Красный для отклоненных
            default: return "#7f8c8d"; // Серый для неизвестного статуса
        }
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>
                Приглашения менторов
                {required && <span className={classes.required}>*</span>}
            </h3>

            <div className={classes.form}>
                <div className={classes.inputContainer}>
                    <SearchSelect
                        label={"Пригласить ментора"}
                        url={"/users/options"}
                        onChange={addMentorInvite}
                        notFound={<p>Пользователь не найден.</p>}
                        placeholder={"Введите логин или email пользователя"}
                        clearable={true}
                    />
                </div>
            </div>

            {(existingInvites.length > 0 || newInvites.length > 0) && (
                <div className={classes.mentorHeader}>
                    <h4 className={classes.mentorListTitle}>Список приглашений</h4>
                    <div className={classes.mentorHelp}>
                        Нажмите на приглашение для его удаления
                    </div>
                </div>
            )}

            {existingInvites.length > 0 && (
                <div className={classes.selectionArea}>
                    <h5 className={classes.mentorListTitle} style={{fontSize: '14px', marginBottom: '12px', color: 'var(--secondary-text-color)'}}>
                        Существующие приглашения
                    </h5>
                    <div className={classes.mentorList}>
                        {existingInvites.map((invite) => (
                            <div
                                key={`existing-${invite.id}`}
                                className={classes.mentorItem}
                                onClick={() => requestDeleteInvite(invite, true)}
                            >
                                <div>
                                    {invite.username}
                                    <div style={{
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        color: getStatusColor(invite.status)
                                    }}>
                                        Статус: {getStatusText(invite.status)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {newInvites.length > 0 && (
                <div className={classes.selectionArea}>
                    <h5 className={classes.mentorListTitle} style={{fontSize: '14px', marginBottom: '12px', color: 'var(--secondary-text-color)'}}>
                        Новые приглашения
                    </h5>
                    <div className={classes.mentorList}>
                        {newInvites.map((invite, index) => (
                            <div
                                key={`new-${idGenerator}-${index}`}
                                className={classes.mentorItem}
                                onClick={() => requestDeleteInvite(invite, false)}
                            >
                                <div>
                                    {invite.username}
                                    <div style={{
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        color: '#7f8c8d'
                                    }}>
                                        Статус: Не отправлено
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal
                isOpen={deleteConfirm.show}
                onConfirm={deleteInvite}
                onReject={() => setDeleteConfirm({show: false, invite: null, isExisting: false})}
                confirmText="Удалить"
                rejectText="Отмена"
                title="Удалить приглашение?"
            >
                <p className={classes.modalText}>
                    Вы уверены, что хотите удалить приглашение для "{deleteConfirm.invite?.username}" из списка?
                </p>
            </Modal>
        </div>
    );
});

export default MentorInviteStackInput;