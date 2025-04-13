import React, { useState } from 'react';

const UserEditForm = ({ userId }) => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        avatar: null
    });
    const [preview, setPreview] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({ ...prev, avatar: file }));

        // Превью аватара
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const formDataToSend = new FormData();
            if (formData.email) formDataToSend.append('email', formData.email);
            if (formData.username) formDataToSend.append('username', formData.username);
            if (formData.avatar) formDataToSend.append('avatar', formData.avatar);

            const response = await fetch(`/api/user/${userId}`, {
                method: 'PUT',
                body: formDataToSend
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error updating user');

            setMessage('User  updated successfully!');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Avatar:</label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                {preview && <img src={preview} alt="Preview" width="100" />}
            </div>

            <div>
                <label>Email:</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required // Добавлено для обязательного поля
                />
            </div>

            <div>
                <label>Username:</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required // Добавлено для обязательного поля
                />
            </div>

            <button type="submit">Update</button>

            {message && <p>{message}</p>}
        </form>
    );
};

export default UserEditForm;