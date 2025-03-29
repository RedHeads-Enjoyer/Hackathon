import React, { useState, FormEvent } from "react";
import { Form, Button, Card, Alert, Container } from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {registerAPI} from "./registerAPI.ts";

type RegisterFormData = {
    email: string,
    username: string,
    password: string,
    confirmPassword: string
}

const Register: React.FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
    });

    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);

    const navigate = useNavigate()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Валидация
        if (!formData.email || !formData.username || !formData.password) {
            return setError("Все поля обязательны для заполнения");
        }

        if (formData.password !== formData.confirmPassword) {
            return setError("Пароли не совпадают");
        }

        if (formData.password.length < 8) {
            return setError("Пароль должен содержать минимум 8 символов");
        }

        // Проверка email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return setError("Введите корректный email");
        }

        try {
            setLoading(true);

            const result = await registerAPI.register(formData);
            localStorage.setItem('access_token', result.access_token)
            navigate('/')
        } catch (err) {
            setError("Ошибка регистрации: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "500px" }}>
                <Card>
                    <Card.Body>
                        <h2 className="text-center mb-4">Регистрация</h2>
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}

                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="formEmail">
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="example@mail.com"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formUsername">
                                <Form.Label>Никнейм</Form.Label>
                                <Form.Control
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="cool_nickname"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formPassword">
                                <Form.Label>Пароль</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Не менее 6 символов"
                                    required
                                />
                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formConfirmPassword">
                                <Form.Label>Подтвердите пароль</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Повторите пароль"
                                    required
                                />
                            </Form.Group>

                            <Button
                                disabled={loading}
                                className="w-100 mt-3"
                                type="submit"
                                variant="primary"
                            >
                                {loading ? "Регистрация..." : "Зарегистрироваться"}
                            </Button>
                        </Form>

                        <div className="w-100 text-center mt-3">
                            Уже есть аккаунт? <Link to="/signin">Войти</Link>
                        </div>
                    </Card.Body>
                </Card>
            </div>
        </Container>
    );
};

export default Register;