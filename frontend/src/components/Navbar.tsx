import { MdLogin, MdLogout } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { canManageSlots } from "../utils/roles";

function Navbar() {
    const navigate = useNavigate();

    const token = sessionStorage.getItem("jwt_token");
    const username = sessionStorage.getItem("name");
    const role = sessionStorage.getItem("role")

    const isLoggedIn = !!token;

    function handleLogout() {
        // Remove authentication information
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("name");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("user_id");

        // Redirect to Home
        navigate("/");
    }
    return (
        <nav className="navbar">
        <div className="navbar-links">
            <Link to="/" className="navbar-home-button">
                Home
            </Link>
            {isLoggedIn && canManageSlots(role) && (
                <Link to="/slots" className="navbar-home-button">
                    Meal slots
                </Link>
            )}
        </div>
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