import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { isStaff } from "../utils/roles";

function Home() {
    const navigate = useNavigate();

    const isLoggedIn = !!sessionStorage.getItem("jwt_token");
    const role = sessionStorage.getItem("role");

    return (
        <>
            <Navbar />
            <div className="home-container">
                <h1>Welcome to the Mountain Hut</h1>
                <p>Choose your action below:</p>
                <div className="button-container">
                    {/* MH-01: login is required, ProtectedRoute redirects if needed */}
                    <button onClick={() => navigate("/book")} className="nav-button">
                        Book a Table
                    </button>
                    {isLoggedIn && isStaff(role) && (
                        <button onClick={() => navigate("/slots")} className="nav-button">
                            Manage meal slots
                        </button>
                    )}
                    {!isLoggedIn && (
                        <button onClick={() => navigate("/login")} className="nav-button">
                            Login
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}

export default Home;
