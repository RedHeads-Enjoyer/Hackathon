import {BrowserRouter as Router, Routes, Route, Outlet} from 'react-router-dom';
import Header from "./components/header/Header.tsx";
import HackathonList from "./modules/hackathonList/HackathonList.tsx";
import Register from "./modules/auth/Register";
import Login from "./modules/auth/Login";
import Logout from "./modules/auth/Logout";
import {ProtectedRoute} from "./components/protectedRoute/ProtectedRoute";
import {loginSuccess} from "./modules/auth/store/authSlice.ts";
import {authAPI} from "./modules/auth/authAPI.ts";
import {useEffect, useState} from "react";
import {useAppDispatch} from "./store/hooks.ts";
import StoreDebugger from "./components/storeDebugger/StoreDebugger.tsx";
import NotFound from "./modules/auth/NotFound.tsx";
import PermissionDenied from "./modules/auth/PermissionDenied.tsx";
import CreateHackathonItem from "./modules/hackathonItem/CreateHackathonPage.tsx";
import {logout} from "./modules/auth/store/authSlice.ts";
import UserEditForm from "./modules/user/UserEditForm.tsx";
import UserList from "./modules/user/UserList.tsx";
import CreateOrganizationPage from "./modules/organozaton/CreateOrganizationPage.tsx";

function App() {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return
            }
            try {
                console.log("ver")
                const userData = await authAPI.verify();
                dispatch(loginSuccess(userData));
            } catch (error) {
                dispatch(logout());
            } finally {
                setLoading(false)
            }
        };

        initializeAuth();
    }, [dispatch]);

    if (loading) {
        return <div>Loading...</div>; // Можно заменить на компонент загрузки
    }

    return (
        <Router>
            <Header/>
            <Routes>
                <Route element={<ProtectedRoute roleLevel={1}><Outlet /></ProtectedRoute>}>
                    <Route path="/" element={<HackathonList />}/>
                    <Route path="/user/edit" element={<UserEditForm userId={1}/> } />
                    <Route path="/user/list" element={<UserList /> } />
                    <Route path="/hackathon/create" element={<CreateHackathonItem />} />
                    <Route path={"/organization/create"} element={<CreateOrganizationPage/>}/>
                </Route>

                {/* Авторизация */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />

                {/* Служебные пути */}
                <Route path="/permission-denied" element={<PermissionDenied/>}/>
                <Route path="*" element={<NotFound />} />
            </Routes>
            <StoreDebugger />
        </Router>
    );
}


export default App;