import { useState } from "react";
import { useAppSelector } from "../../store/hooks.ts";
import { Link } from "react-router-dom";
import classes from './header.module.css';
import { AuthState } from "../../modules/auth/store/authSlice.ts";

function Header() {
    const authState: AuthState = useAppSelector(state => state.auth);
    const [menuOpen, setMenuOpen] = useState(false);

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    // Функция для закрытия меню после клика по ссылке
    const closeMenu = () => {
        setMenuOpen(false);
    };

    const renderNavLinks = () => (
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
            {authState?.user && (
                <>
                    <p className={classes.username}>{authState.user.username}</p>
                    <Link to='/logout' onClick={closeMenu}>Выход</Link>
                </>
            )}
        </>
    );

    return (
        <header className={classes.header}>
            <h3 className={classes.logo}>
                <Link to='/' onClick={closeMenu}>ХАКАНТОН</Link>
            </h3>

            {authState.user == null ? (
                <>
                    <nav className={classes.nav}>
                        <Link to='/login'>Вход</Link>
                        <Link to='/register'>Регистрация</Link>
                    </nav>

                    {/* Гамбургер для мобильной версии */}
                    <button
                        className={`${classes.hamburger} ${menuOpen ? classes.open : ''}`}
                        onClick={toggleMenu}
                        aria-label="Меню"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* Мобильное меню */}
                    <div className={`${classes.mobile_menu} ${menuOpen ? classes.open : ''}`}>
                        <Link to='/login' onClick={closeMenu}>Вход</Link>
                        <Link to='/register' onClick={closeMenu}>Регистрация</Link>
                    </div>
                </>
            ) : (
                <>
                    <nav className={classes.nav}>
                        {renderNavLinks()}
                    </nav>

                    {/* Гамбургер для мобильной версии */}
                    <button
                        className={`${classes.hamburger} ${menuOpen ? classes.open : ''}`}
                        onClick={toggleMenu}
                        aria-label="Меню"
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>

                    {/* Мобильное меню */}
                    <div className={`${classes.mobile_menu} ${menuOpen ? classes.open : ''}`}>
                        {renderNavLinks()}
                    </div>
                </>
            )}
        </header>
    );
}

export default Header;