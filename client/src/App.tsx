import {BrowserRouter as Router, Routes, Route, Outlet} from 'react-router-dom';
import Header from "./components/header/Header.tsx";
import HackathonList from "./modules/hackathonList/HackathonList.tsx";
import Register from "./modules/auth/Register";
import Login from "./modules/auth/Login";
import Logout from "./modules/auth/Logout";
import ProtectedRoute from "./components/protectedRoute/ProtectedRoute";
import {loginSuccess} from "./modules/auth/store/authSlice.ts";
import {authAPI} from "./modules/auth/authAPI.ts";
import {useEffect} from "react";
import {useAppDispatch} from "./store/hooks.ts";
import StoreDebugger from "./components/storeDebugger/StoreDebugger.tsx";
import NotFound from "./modules/auth/NotFound.tsx";
import PermissionDenied from "./modules/auth/PermissionDenied.tsx";
import CreateHackathonItem from "./modules/hackathonItem/CreateHackathonPage.tsx";

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('access_token');

            if (token) {
                try {
                    const userData = await authAPI.verify();
                    dispatch(loginSuccess(userData));
                } catch (error) {
                    localStorage.removeItem('access_token');
                }
            }
        };

        checkAuth();
    }, [dispatch]);

    return (
        <Router>
            <Header/>
            <Routes>
                <Route path="/" element={
                    <ProtectedRoute>
                        <HackathonList />
                    </ProtectedRoute>
                } />

                <Route element={<ProtectedRoute roles={["User"]}><Outlet /></ProtectedRoute>}>
                    <Route path="/hackathon/create" element={<CreateHackathonItem />} />
                    <Route path="/user1" element={<HackathonList />} />
                    <Route path="/user2" element={<HackathonList />} />
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