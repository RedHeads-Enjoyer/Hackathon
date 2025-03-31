import React, {useState, FormEvent} from "react";
import { Form, Button, Card, Alert, Container } from "react-bootstrap";
import {Link, useNavigate} from "react-router-dom";
import {LoginFormData} from "./authTypes.ts";
import {authAPI} from "./authAPI.ts";
import {loginStart, loginSuccess} from "./store/authSlice.ts";
import {useAppDispatch, useAppSelector} from "../../store/hooks.ts";

const Login: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [error, setError] = useState<String | null>(null)
    const dispatch = useAppDispatch();
    const navigate = useNavigate()
    const { loading } = useAppSelector((state) => state.auth);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        dispatch(loginStart());

        if (!formData.email || !formData.password) {
            setError("Заполните все поля");
        }

        try {
            const result = await authAPI.login(formData);
            localStorage.setItem('access_token', result.access_token);

            const userData = await authAPI.verify();
            dispatch(loginSuccess(userData));
            navigate('/')
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка входа";
            setError(errorMessage);
        }
    };

    return (
        <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
            <div className="w-100" style={{ maxWidth: "400px" }}>
                <Card>
                    <Card.Body>
                        <h2 className="text-center mb-4">Вход</h2>
                        {error  && <Alert variant="danger">{error }</Alert>}

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

                            <Form.Group className="mb-3" controlId="formPassword">
                                <Form.Label>Пароль</Form.Label>
                                <Form.Control
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Пароль"
                                    required
                                />
                            </Form.Group>

                            <Button
                                disabled={loading}
                                className="w-100 mt-3"
                                type="submit"
                            >
                                {loading ? "Вход..." : "Войти"}
                            </Button>
                        </Form>

                        <div className="w-100 text-center mt-3">
                            <Link to="/forgot-password">Забыли пароль?</Link>
                        </div>
                    </Card.Body>
                </Card>

                <div className="w-100 text-center mt-2">
                    Нет аккаунта? <Link to="/signup">Зарегистрируйтесь</Link>
                </div>
            </div>
        </Container>
    );
};

export default Login;