import React, { useState, FormEvent } from "react";
import {Link, useNavigate} from "react-router-dom";
import {authAPI} from "./authAPI.ts";
import {useAppDispatch} from "../../store/hooks.ts";
import {loginSuccess} from "./store/authSlice.ts";
import classes from "./auth.module.css";
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import Error from "../../components/error/Error.tsx";
import Button from "../../components/button/Button.tsx";

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

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const dispatch = useAppDispatch();

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
        setLoading(true)
        setError(null);

        try {
            if (!formData.email || !formData.username || !formData.password) {
                return setError("Все поля обязательны для заполнения");
            }

            if (formData.password !== formData.confirmPassword) {
                return setError("Пароли не совпадают");
            }

            if (formData.password.length < 8) {
                return setError("Пароль должен содержать минимум 8 символов");
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                return setError("Введите корректный email");
            }

            const result = await authAPI.register(formData);
            localStorage.setItem('access_token', result.access_token)
            const userData = await authAPI.verify();
            dispatch(loginSuccess(userData));
            navigate('/')
        } catch (err) {
            setError("Ошибка регистрации: " + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={classes.app_container}>
            <div className={classes.form_container}>
                <PageLabel text="Вход"/>
                <Input
                    type={"email"}
                    name={"email"}
                    value={formData.email}
                    onChange={handleChange}
                    label={"Email"}
                    placeholder={"example@mail.ru"}
                />
                <Input
                    type={"text"}
                    name={"username"}
                    value={formData.username}
                    onChange={handleChange}
                    label={"Имя пользователя"}
                    placeholder={"Крутой парень"}
                />
                <Input
                    type={"password"}
                    name={"password"}
                    value={formData.password}
                    onChange={handleChange}
                    label={"Пароль"}
                    placeholder={"examplePassword"}
                />
                <Input
                    type={"password"}
                    name={"confirmPassword"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    label={"Повторите пароль"}
                    placeholder={"examplePassword"}
                />
                <Button
                    onClick={handleSubmit}
                    loading={loading}
                >
                    Зарегистрироваться
                </Button>

                {error != null && <Error><p>{error}</p></Error>}


                <span className={classes.info}>
                    <p>Есть аккаунт? </p>
                    <Link to={"/login"}>Войти</Link>
                </span>

            </div>
        </div>
    );
};

export default Register;