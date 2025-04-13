import React, { useEffect, useState } from 'react';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/user'); // Убедитесь, что этот путь соответствует вашему API
                if (!response.ok) {
                    throw new Error('Ошибка при получении пользователей');
                }
                const data = await response.json();
                console.log(data)
                setUsers(data); // Предполагается, что сервер возвращает массив пользователей
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return <p>Загрузка...</p>;
    }

    if (error) {
        return <p>Ошибка: {error}</p>;
    }

    return (
        <div>
            <h1>Список пользователей</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>
                        <strong>Email:</strong> {user.email} <br />
                        <strong>Username:</strong> {user.username} <br />
                        {console.log(user.Avatar)}
                        {user.Avatar && <img src={user.Avatar.URL} alt="Avatar" width="50" />}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default UserList;