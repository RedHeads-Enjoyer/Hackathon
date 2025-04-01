import {useAppSelector} from "../../store/hooks.ts";
import {Link} from "react-router-dom";
import styles from './header.module.css'

function Header() {
    const authState = useAppSelector(state => state.auth);
    return (
        <header className={styles.header}>
            <h3 className={styles.logo}>
                <Link to={'/'}>ХАКАНТОН</Link>
            </h3>
            <nav className={styles.nav}>
                {authState.user == null ?
                    <>
                        <Link to={'/login'}>Вход</Link>
                        <Link to={'/register'}>Регистрация</Link>
                    </>
                    :
                    <>
                        <Link to={'/logout'}>Выход</Link>
                    </>
                }

            </nav>
        </header>

    );
}

export default Header;