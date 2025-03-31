import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/header/Header.tsx";
import HackathonList from "./modules/hackathonList/HackathonList.tsx";
import Register from "./modules/auth/Register";
import Login from "./modules/auth/Login";
import Logout from "./modules/auth/Logout";
import ProtectedRoute from "./components/protectedRoute/ProtectedRoute";
import {loginFailure, loginStart, loginSuccess} from "./modules/auth/store/authSlice.ts";
import {authAPI} from "./modules/auth/authAPI.ts";
import {useEffect} from "react";
import {useAppDispatch} from "./store/hooks.ts";
import StoreDebugger from "./components/StoreDebugger.tsx";

function App() {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const checkAuth = async () => {
            dispatch(loginStart()); // Устанавливаем loading = true
            const token = localStorage.getItem('access_token');

            if (token) {
                try {
                    const userData = await authAPI.verify();
                    dispatch(loginSuccess(userData));
                } catch (error) {
                    localStorage.removeItem('access_token');
                    dispatch(loginFailure());
                }
            } else {
                dispatch(loginFailure());
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
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <StoreDebugger />
        </Router>
    );
}

function NotFoundPage() {
    return <div>Страница не найдена</div>;
}


export default App;