import React, { useState, FormEvent } from "react";
import classes from './auth.module.css';
import { Link, useNavigate } from "react-router-dom";
import { LoginFormData } from "./authTypes.ts";
import { authAPI } from "./authAPI.ts";
import { loginFailure, loginStart, loginSuccess } from "./store/authSlice.ts";
import { useAppDispatch } from "../../store/hooks.ts";
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import Button from "../../components/button/Button.tsx";
import Error from "../../components/error/Error.tsx";

const Login: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Сброс ошибок при вводе
        setFormErrors(prev => ({
            ...prev,
            [name]: undefined
        }));
    };

    const validateForm = () => {
        const errors: { email?: string; password?: string } = {};
        if (!formData.email) {
            errors.email = "Email не может быть пустым";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = "Email не верного формата";
            }
        }
        if (!formData.password) {
            errors.password = "Пароль не может быть пустым";
        }
        return errors;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        dispatch(loginStart());

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setLoading(false);
            dispatch(loginFailure());
            return;
        }

        try {
            const result = await authAPI.login(formData);
            localStorage.setItem('access_token', result.access_token);

            const userData = await authAPI.verify();
            dispatch(loginSuccess(userData));
            navigate('/');
        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка входа";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={classes.app_container}>
            <div className={classes.form_container}>
                <PageLabel>Вход</PageLabel>
                <Input
                    type={"email"}
                    name={"email"}
                    value={formData.email}
                    onChange={handleChange}
                    label={"Email"}
                    placeholder={"example@mail.ru"}
                    error={formErrors.email}
                />
                <Input
                    type={"password"}
                    name={"password"}
                    value={formData.password}
                    onChange={handleChange}
                    label={"Пароль"}
                    placeholder={"examplePassword"}
                    error={formErrors.password}
                />
                <Button
                    onClick={handleSubmit}
                    loading={loading}
                    className={classes.button}
                >
                    Войти
                </Button>

                {error && <Error><p>{error}</p></Error>}

                <span className={classes.info}>
                    <p>Нет аккаунта? </p>
                    <Link to={"/register"}>Зарегистрироваться</Link>
                </span>
            </div>
        </div>
    );
};

export default Login;