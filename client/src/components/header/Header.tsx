import { Container, Nav, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import {useAppSelector} from "../../store/hooks.ts";

function Header() {
    const authState = useAppSelector(state => state.auth);
    return (
        <Navbar bg="dark" data-bs-theme="dark" expand="xl">
            <Container fluid>
                <Navbar.Brand>ХАКАНТОН</Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        {authState.user != null ?
                            <Nav.Link as={Link} to="/logout">Выход</Nav.Link>
                            :
                            <>
                                <Nav.Link as={Link} to="/login">Вход</Nav.Link>
                                <Nav.Link as={Link} to="/register">Регистрация</Nav.Link>
                            </>
                        }
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default Header;