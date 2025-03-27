import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {useEffect} from "react";

function App() {
    useEffect(() => {
        console.log("asdasd")
    }, [])
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                {/* Добавьте другие маршруты по необходимости */}
                <Route path="*" element={<NotFoundPage />} /> {/* Для 404 страницы */}
            </Routes>
        </Router>
    );
}

function HomePage() {
    return <>Главная страница -123 фывфывфы</>;
}

function AboutPage() {
    return <>О нас</>;
}

function ContactPage() {
    return <>Контакты</>;
}

function NotFoundPage() {
    return <>404 - Страница не найдена</>;
}

export default App;