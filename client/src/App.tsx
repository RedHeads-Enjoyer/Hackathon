import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './modules/register/Register.tsx';
import Header from "./components/header/Header.tsx";
import Login from "./modules/login/Login.tsx";
import Logout from "./modules/logout/logout.tsx";
import HackathonList from "./modules/hackathonList/HackathonList.tsx";

function App() {
    return (
        <Router>
            <Header/>
            <Routes>
                <Route path="/" element={<HackathonList />} /> {/* Добавьте главную страницу */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="*" element={<NotFoundPage />} /> {/* Для 404 */}
            </Routes>
        </Router>

    );
}

function NotFoundPage() {
    return <div>Страница не найдена</div>;
}


export default App;