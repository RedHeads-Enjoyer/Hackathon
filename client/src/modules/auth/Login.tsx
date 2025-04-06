import React, {useState, FormEvent} from "react";
import classes from './auth.module.css'
import {Link, useNavigate} from "react-router-dom";
import {LoginFormData} from "./authTypes.ts";
import {authAPI} from "./authAPI.ts";
import {loginFailure, loginStart, loginSuccess} from "./store/authSlice.ts";
import {useAppDispatch} from "../../store/hooks.ts";
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import Button from "../../components/button/Button.tsx";
import Error from "../../components/error/Error.tsx";

const Login: React.FC = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
    });
    const [error, setError] = useState<String | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
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
        setError(null)
        dispatch(loginStart());

        if (!formData.email || !formData.password) {
            setError("Заполните все поля");
            setLoading(false)
            dispatch(loginFailure())
            return
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
        } finally {
            setLoading(false)
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
                />
                <Input
                    type={"password"}
                    name={"password"}
                    value={formData.password}
                    onChange={handleChange}
                    label={"Пароль"}
                    placeholder={"examplePassword"}
                />
                <Button
                    onClick={handleSubmit}
                    loading={loading}
                    className={classes.button}
                >
                    Войти
                </Button>

                {error != null && <Error><p>{error}</p></Error>}


                <span className={classes.info}>
                    <p>Нет аккаунта? </p>
                    <Link to={"/register"}>Зарегистрироваться</Link>
                </span>

            </div>
        </div>
    );
};

export default Login;