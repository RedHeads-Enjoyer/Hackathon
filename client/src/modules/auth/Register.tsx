import React, { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authAPI } from "./authAPI.ts";
import { useAppDispatch } from "../../store/hooks.ts";
import { loginSuccess } from "./store/authSlice.ts";
import classes from "./auth.module.css";
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import Error from "../../components/error/Error.tsx";
import Button from "../../components/button/Button.tsx";

type RegisterFormData = {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
};

const Register: React.FC = () => {
    const [formData, setFormData] = useState<RegisterFormData>({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [formErrors, setFormErrors] = useState<{ email?: string; username?: string; password?: string; confirmPassword?: string }>({});
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        // Сброс ошибок при вводе
        setFormErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));
    };

    const validateForm = () => {
        const errors: { email?: string; username?: string; password?: string; confirmPassword?: string } = {};

        if (!formData.email) {
            errors.email = "Email не может быть пустым";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = "Введите корректный email";
            }
        }

        if (!formData.username) {
            errors.username = "Имя пользователя не может быть пустым";
        }

        if (!formData.password) {
            errors.password = "Пароль не может быть пустым";
        } else if (formData.password.length < 8) {
            errors.password = "Пароль должен содержать минимум 8 символов";
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Пароли не совпадают";
        }

        return errors;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setFormErrors(validationErrors);
            setLoading(false);
            return;
        }

        try {
            const result = await authAPI.register(formData);
            localStorage.setItem("access_token", result.access_token);
            const userData = await authAPI.verify();
            dispatch(loginSuccess(userData));
            navigate("/hackathons");
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={classes.app_container}>
            <div className={classes.form_container}>
                <PageLabel>Регистрация</PageLabel>
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
                    type={"text"}
                    name={"username"}
                    value={formData.username}
                    onChange={handleChange}
                    label={"Имя пользователя"}
                    placeholder={"Крутой парень"}
                    error={formErrors.username}
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
                <Input
                    type={"password"}
                    name={"confirmPassword"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    label={"Повторите пароль"}
                    placeholder={"examplePassword"}
                    error={formErrors.confirmPassword}
                />
                <Button
                    onClick={handleSubmit}
                    loading={loading}
                    className={classes.button}
                >
                    Зарегистрироваться
                </Button>

                {error && <Error><p>{error}</p></Error>}

                <span className={classes.info}>
                    <p>Есть аккаунт? </p>
                    <Link to={"/login"}>Войти</Link>
                </span>
            </div>
        </div>
    );
};

export default Register;