import {useAppSelector} from "../../store/hooks.ts";
import {Link} from "react-router-dom";
import classes from './header.module.css'
import {AuthState} from "../../modules/auth/store/authSlice.ts";

function Header() {
    const authState: AuthState = useAppSelector(state => state.auth);
    return (
        <header className={classes.header}>
            {authState.user == null ?
                <h3 className={classes.logo_unauthorized}>
                    ХАКАНТОН
                </h3>
                :
                <>
                    <h3 className={classes.logo}>
                        <Link to={'/'}>ХАКАНТОН</Link>
                    </h3>
                    <nav className={classes.nav}>
                        <Link to={'/logout'}>Выход</Link>
                        <p>{authState?.user.email}</p>
                    </nav>
                </>
            }
        </header>

    );
}

export default Header;