import {BrowserRouter as Router, Routes, Route, Outlet} from 'react-router-dom';
import Header from "./components/header/Header.tsx";
import Register from "./modules/auth/Register";
import Login from "./modules/auth/Login";
import Logout from "./modules/auth/Logout";
import {ProtectedRoute} from "./components/protectedRoute/ProtectedRoute";
import {loginSuccess} from "./modules/auth/store/authSlice.ts";
import {authAPI} from "./modules/auth/authAPI.ts";
import {useEffect, useState} from "react";
import {useAppDispatch} from "./store/hooks.ts";
// import StoreDebugger from "./components/storeDebugger/StoreDebugger.tsx";
import NotFound from "./modules/auth/NotFound.tsx";
import PermissionDenied from "./modules/auth/PermissionDenied.tsx";
import CreateHackathon from "./modules/hackathon/CreateHackathon.tsx";
import {logout} from "./modules/auth/store/authSlice.ts";
import CreateOrganizationPage from "./modules/organozaton/CreateOrganizationPage.tsx";
import MyOrganizationsPage from "./modules/organozaton/MyOrganizationsPage.tsx";
import Organizations from "./modules/organozaton/Organizations.tsx";
import Technologies from "./modules/technologies/Technologies.tsx";
import CreateTechnologyPage from "./modules/technologies/CreateTechnologyPage.tsx";
import HackathonList from "./modules/hackathon/HackathonList.tsx";
import OpenHackathon from "./modules/hackathon/OpenHackathon.tsx";
import HackathonEdit from "./modules/hackathon/HackathonEdit.tsx";
import MentorInvites from "./modules/invites/MentorInvites.tsx";
import HackathonDashboard from "./modules/hackathon/HackathonDashboard.tsx";

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
        return <div>Loading...</div>;
    }

    return (
        <Router>
            <Header/>
            <Routes>
                <Route element={<ProtectedRoute roleLevel={1}><Outlet /></ProtectedRoute>}>
                    <Route path="/hackathon/list" element={<HackathonList />}/>
                    <Route path="/invites/mentor" element={<MentorInvites />}/>
                    <Route path="/hackathon/create" element={<CreateHackathon />} />
                    <Route path="/hackathon/:id/dashboard" element={<HackathonDashboard />} />
                    <Route path="/hackathon/:id" element={<OpenHackathon />} />
                    <Route path="/hackathon/:id/edit" element={<HackathonEdit />} />
                    <Route path={"/organization/create"} element={<CreateOrganizationPage/>}/>
                    <Route path={"/organization/my"} element={<MyOrganizationsPage/>}/>
                </Route>

                <Route element={<ProtectedRoute roleLevel={2}><Outlet /></ProtectedRoute>}>
                    <Route path="/organization/list" element={<Organizations />}/>
                    <Route path="/technology/list" element={<Technologies />}/>
                    <Route path="/technology/create" element={<CreateTechnologyPage />}/>
                </Route>

                {/* Авторизация */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />

                {/* Служебные пути */}
                <Route path="/permission-denied" element={<PermissionDenied/>}/>
                <Route path="*" element={<NotFound />} />
            </Routes>
            {/*<StoreDebugger />*/}
        </Router>
    );
}


export default App;