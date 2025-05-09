import {useAppSelector} from "../../store/hooks.ts";
import {Link} from "react-router-dom";
import classes from './header.module.css'
import {AuthState} from "../../modules/auth/store/authSlice.ts";

function Header() {
    const authState: AuthState = useAppSelector(state => state.auth);
    return (
        <header className={classes.header}>
            {authState.user == null ?
                <>
                    <h3 className={classes.logo}>
                        <Link to={'/'}>ХАКАНТОН</Link>
                    </h3>
                        <nav className={classes.nav}>
                            <Link to={'/login'}>Вход</Link>
                            <Link to={'/register'}>регистрация</Link>
                        </nav>

                </>
                :
                <>
                    <h3 className={classes.logo}>
                        <Link to={'/'}>ХАКАНТОН</Link>
                    </h3>
                    <nav className={classes.nav}>
                        {authState?.user.systemRole == 1 &&
                            <>
                                <Link to={'/organizations/my'}>Мои организации</Link>
                                <Link to={'/organization/create'}>Создать организацию</Link>
                                <Link to={'/hackathon/create'}>Создать хакатон</Link>
                                <Link to={'/hackathons'}>Хакатоны</Link>
                                <Link to={'/invites/mentor'}>Приглашения менторства</Link>
                            </>
                        }
                        {(authState?.user.systemRole == 2 || authState?.user.systemRole == 3) &&
                            <>
                                <Link to={'/organizations'}>Организации</Link>
                                <Link to={'/technologies'}>Технологии</Link>
                                <Link to={'/technology/create'}>Создать технологию</Link>
                            </>
                        }
                        <p>{authState?.user.username}</p>
                        <Link to={'/logout'}>Выход</Link>
                    </nav>
                </>
            }
        </header>

    );
}

export default Header;