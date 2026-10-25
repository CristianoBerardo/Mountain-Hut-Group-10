import { MdLogin, MdLogout } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
    const navigate = useNavigate();

    const token = sessionStorage.getItem("jwt_token");
    const username = sessionStorage.getItem("username");
    const role = sessionStorage.getItem("role")

    const isLoggedIn = !!token;

    function handleLogout() {
        // Remove authentication information
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("username");

        // Redirect to Home
        navigate("/");
    }
    return (
        <nav className="navbar">
        <Link to="/" className="navbar-home-button">
            Home
        </Link>
        {isLoggedIn ? (
            <button
                type="button"
                onClick={handleLogout}
                className="navbar-auth-button"
            >
                <MdLogout size={20} />
                Logout ({username} - {role})
            </button>
        ) : (
            <Link to="/login" className="navbar-auth-button">
                <MdLogin size={20} />
                Login
            </Link>
        )}
        </nav>
    );
}

export default Navbar;