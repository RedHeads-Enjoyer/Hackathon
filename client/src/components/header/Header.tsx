import { useState, useEffect } from "react";
import {useAppDispatch, useAppSelector} from "../../store/hooks.ts";
import {Link, useNavigate} from "react-router-dom";
import classes from './header.module.css';
import {AuthState, logout} from "../../modules/auth/store/authSlice.ts";
import {authAPI} from "../../modules/auth/authAPI.ts";
import Loader from "../loader/Loader.tsx";

function Sidebar() {
    const authState: AuthState = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuCollapsed, setMenuCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            await authAPI.logout();
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            // Очищаем хранилище
            localStorage.removeItem('access_token');

            // Сбрасываем состояние
            dispatch(logout());

            // Перенаправляем
            navigate('/login', { replace: true });

            setIsLoggingOut(false);
        }
    };

    // Загружаем состояние меню из localStorage при монтировании
    useEffect(() => {
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState) {
            setMenuCollapsed(savedState === 'true');
        }
    }, []);

    // Сохраняем состояние в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', String(menuCollapsed));
    }, [menuCollapsed]);

    const toggleMobileMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const toggleCollapse = () => {
        setMenuCollapsed(!menuCollapsed);
    };

    // Функция для закрытия меню после клика по ссылке на мобильных
    const closeMenu = () => {
        if (window.innerWidth <= 768) {
            setMenuOpen(false);
        }
    };

    return (
        <div className={classes.app_container}>
            {/* Мобильная кнопка-гамбургер */}
            <button
                className={`${classes.mobile_toggle} ${menuOpen ? classes.open : ''}`}
                onClick={toggleMobileMenu}
                aria-label="Меню"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Затемнение фона при открытом меню на мобильных */}
            <div
                className={`${classes.overlay} ${menuOpen ? classes.open : ''}`}
                onClick={closeMenu}
            ></div>

            <aside className={`${classes.sidebar} ${menuCollapsed ? classes.collapsed : ''} ${menuOpen ? classes.open : ''}`}>
                <div className={classes.logo}>
                    <Link to='/hackathon/list' onClick={closeMenu}>ХАКАНТОН</Link>
                </div>

                <button
                    className={`${classes.toggle_button} ${menuCollapsed ? classes.collapsed : ''}`}
                    onClick={toggleCollapse}
                    aria-label={menuCollapsed ? "Развернуть меню" : "Свернуть меню"}
                >
                    <span></span>
                </button>

                <nav className={classes.nav}>
                    {authState.user == null ? (
                        <>
                            <Link to='/login' onClick={closeMenu}>Вход</Link>
                            <Link to='/register' onClick={closeMenu}>Регистрация</Link>
                        </>
                    ) : (
                        <>
                            {authState?.user?.systemRole == 1 && (
                                <>
                                    <Link to='/organization/my' onClick={closeMenu}>Мои организации</Link>
                                    <Link to='/organization/create' onClick={closeMenu}>Создать организацию</Link>
                                    <Link to='/hackathon/create' onClick={closeMenu}>Создать хакатон</Link>
                                    <Link to='/hackathon/list' onClick={closeMenu}>Хакатоны</Link>
                                    <Link to='/invites/mentor' onClick={closeMenu}>Приглашения менторства</Link>
                                </>
                            )}
                            {(authState?.user?.systemRole == 2 || authState?.user?.systemRole == 3) && (
                                <>
                                    <Link to='/organization/list' onClick={closeMenu}>Организации</Link>
                                    <Link to='/technology/list' onClick={closeMenu}>Технологии</Link>
                                    <Link to='/technology/create' onClick={closeMenu}>Создать технологию</Link>
                                </>
                            )}
                        </>
                    )}
                </nav>

                {authState.user && (
                    <div className={classes.user_block}>
                        <p className={classes.username}>{authState.user.username}</p>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={classes.logout_button}
                        >
                            {isLoggingOut ? <Loader size={"small"}/>: 'Выход'}
                        </button>
                    </div>
                )}
                <p className={classes.info}>Сайт сделан в рамках ВКР</p>
                <p className={classes.info}>Лосев Антон Сергеевич ИКБО-02-21</p>
            </aside>
        </div>
    );
}

export default Sidebar;