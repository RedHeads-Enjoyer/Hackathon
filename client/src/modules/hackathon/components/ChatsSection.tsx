import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import classes from "../hackathon.module.css";

import {HackathonAPI} from "../hackathonAPI.ts";
import {ChatItem, ChatMessage} from "../types.ts";
import {ChatSocket} from "../../../ChatSocket.ts";
import {AuthState} from "../../auth/store/authSlice.ts";
import {useAppSelector} from "../../../store/hooks.ts";
import Loader from "../../../components/loader/Loader.tsx";
import Button from "../../../components/button/Button.tsx";
import TextArea from "../../../components/textArea/TextArea.tsx";

const ChatSection = () => {
    const {id} = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;
    const user: AuthState = useAppSelector(state => state.auth);

    const [chats, setChats] = useState<ChatItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<number | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageText, setMessageText] = useState("");
    const [loading, setLoading] = useState(true);
    const [hackathonName, setHackathonName] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState("");

    // Используем useRef для хранения экземпляра ChatSocket  
    const socketRef = useRef<ChatSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Загрузка списка чатов  
    useEffect(() => {
        setLoading(true);
        HackathonAPI.getAvailableChats(hackathonId)
            .then(response => {
                // Проверяем структуру ответа более детально  
                if (response) {
                    if (Array.isArray(response.chats)) {
                        setChats(response.chats);
                        setHackathonName(response.hackathon_name || "");
                        if (response.chats.length > 0) {
                            setSelectedChat(response.chats[0].id);
                        }
                    } else if (Array.isArray(response)) {
                        // Возможно, API возвращает просто массив  
                        setChats(response);
                        if (response.length > 0) {
                            setSelectedChat(response[0].id);
                        }
                    } else {
                        console.warn("Неожиданный формат ответа:", response);
                        setChats([]);
                    }
                } else {
                    setChats([]);
                    console.warn("Пустой ответ API");
                }
            })
            .catch(error => {
                console.error("Ошибка загрузки чатов:", error);
                setChats([]);  // Устанавливаем пустой массив при ошибке  
            })
            .finally(() => {
                setLoading(false);
            });
    }, [hackathonId]);

    // Загрузка сообщений и подключение к WebSocket при выборе чата  
    useEffect(() => {
        if (selectedChat) {
            setLoading(true);
            setConnectionError("");

            // Загружаем историю сообщений  
            HackathonAPI.getChatMessages(selectedChat)
                .then(response => {
                    // Сортируем сообщения от старых к новым для отображения  
                    setMessages(response.messages.sort((a, b) =>
                        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    ));
                })
                .catch(error => {
                    console.error("Ошибка загрузки сообщений:", error);
                    setConnectionError("Ошибка загрузки сообщений");
                })
                .finally(() => {
                    setLoading(false);
                });

            // Подключаемся к чату через WebSocket  
            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            socketRef.current = new ChatSocket(selectedChat);
            socketRef.current.connect();

            // Проверяем состояние соединения каждую секунду  
            const connectionCheck = setInterval(() => {
                if (socketRef.current) {
                    const connected = socketRef.current.isConnected();
                    setIsConnected(connected);
                }
            }, 1000);

            // Обрабатываем новые сообщения  
            const unsubscribe = socketRef.current.onMessage(newMessage => {
                if (newMessage.error) {
                    console.error("Ошибка сокета:", newMessage.error);
                    setConnectionError(`Ошибка: ${newMessage.error}`);
                    return;
                }

                // Сбрасываем ошибку при успешном получении сообщения  
                setConnectionError("");
                setMessages(prev => [...prev, newMessage]);
            });

            // Отписываемся при размонтировании или смене чата  
            return () => {
                clearInterval(connectionCheck);
                unsubscribe();
                if (socketRef.current) {
                    socketRef.current.disconnect();
                    socketRef.current = null;
                }
            };
        }
    }, [selectedChat]);

    // Скролл к последнему сообщению при получении новых  
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    // Отправка сообщения  
    const sendMessage = () => {
        if (!messageText.trim() || !selectedChat || !socketRef.current) {
            console.error("Не выполнены условия для отправки:", {
                messageText: messageText.trim() ? "Есть" : "Пусто",
                selectedChat,
                socketExists: !!socketRef.current
            });
            return;
        }

        const success = socketRef.current.sendMessage(messageText);

        if (success) {
            setMessageText("");
        } else {
            setConnectionError("Не удалось отправить сообщение. Проверьте соединение.");
        }
    };

    // Получаем название чата по его типу  
    const getChatName = (chat: ChatItem) => {
        return chat.name || `Чат ${chat.id}`;
    };

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size="h3">Чаты - {hackathonName}</PageLabel>

            {loading && chats.length === 0 ? (
                <div className={classes.loading}>Загрузка чатов...</div>
            ) : (
                <div className={classes.chats}>
                    <div className={classes.info_block} style={{flex: "0 0 300px", marginRight: "16px"}}>
                        <h3 className={classes.block_title}>Список чатов</h3>
                        <div className={classes.chat_list}>
                            {Array.isArray(chats) && chats.length > 0 ? (
                                chats.map(chat => (
                                    <div
                                        key={chat.id}
                                        className={`${classes.chat_item} ${selectedChat === chat.id ? classes.selected : ''}`}
                                        onClick={() => setSelectedChat(chat.id)}
                                    >
                                        {getChatName(chat)}
                                    </div>
                                ))
                            ) : (
                                <div className={classes.empty_chat_list}>Нет доступных чатов</div>
                            )}
                        </div>
                    </div>

                    <div className={classes.info_block} style={{flex: "1", display: "flex", flexDirection: "column"}}>
                        {/* Статус соединения */}
                        <div
                            className={`${classes.connection_status} ${isConnected ? classes.connected : classes.disconnected}`}
                            style={{marginBottom: "16px"}}>
                            Статус: {isConnected ? "Подключено" : "Не подключено"}
                            {connectionError && <div className={classes.error_message}>{connectionError}</div>}
                        </div>

                        <div className={classes.messages_container}
                             style={{flex: "1", overflowY: "auto", marginBottom: "16px"}}>
                            {loading ? (
                                <Loader/>
                            ) : messages.length === 0 ? (
                                <div className={classes.empty_messages}>Нет сообщений</div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`${classes.message} ${msg.user_id === user?.user?.id ? classes.my_message : ''}`}
                                    >
                                        <div className={classes.message_header}>
                                            <span
                                                className={classes.message_author}>{msg.user?.name || 'Пользователь'}</span>
                                            <span className={classes.message_time}>
                                            {new Date(msg.created_at).toLocaleTimeString()}
                                        </span>
                                        </div>
                                        <div className={classes.message_content}>{msg.content}</div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef}/>
                        </div>

                        {/* Ввод сообщения */}
                        <div className={classes.message_input_container}>
                        <TextArea
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className={classes.message_input}
                            placeholder="Введите сообщение..."
                            disabled={!isConnected}
                        />
                            <Button
                                onClick={sendMessage}
                                variant={"primary"}
                                disabled={!messageText.trim() || !isConnected}
                            >
                                Отправить
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
    export default ChatSection;