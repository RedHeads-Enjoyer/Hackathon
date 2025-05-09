import { useState, useEffect } from "react";
import { useAppSelector } from "../../store/hooks.ts";
import { Link } from "react-router-dom";
import classes from './header.module.css';
import { AuthState } from "../../modules/auth/store/authSlice.ts";

function Sidebar() {
    const authState: AuthState = useAppSelector(state => state.auth);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuCollapsed, setMenuCollapsed] = useState(false);

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
                    <Link to='/' onClick={closeMenu}>ХАКАНТОН</Link>
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
                                    <Link to='/organizations/my' onClick={closeMenu}>Мои организации</Link>
                                    <Link to='/organization/create' onClick={closeMenu}>Создать организацию</Link>
                                    <Link to='/hackathon/create' onClick={closeMenu}>Создать хакатон</Link>
                                    <Link to='/hackathons' onClick={closeMenu}>Хакатоны</Link>
                                    <Link to='/invites/mentor' onClick={closeMenu}>Приглашения менторства</Link>
                                </>
                            )}
                            {(authState?.user?.systemRole == 2 || authState?.user?.systemRole == 3) && (
                                <>
                                    <Link to='/organizations' onClick={closeMenu}>Организации</Link>
                                    <Link to='/technologies' onClick={closeMenu}>Технологии</Link>
                                    <Link to='/technology/create' onClick={closeMenu}>Создать технологию</Link>
                                </>
                            )}
                        </>
                    )}
                </nav>

                {authState.user && (
                    <div className={classes.user_block}>
                        <p className={classes.username}>{authState.user.username}</p>
                        <Link to='/logout' onClick={closeMenu}>Выход</Link>
                    </div>
                )}
            </aside>
        </div>
    );
}

export default Sidebar;