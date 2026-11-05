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
                {isLoggedIn ? (
                    <>
                        <p>Choose your action below:</p>
                        <div className="button-container">
                            {isStaff(role) && (
                                <button onClick={() => navigate("/slots")} className="nav-button">
                                    Manage meal slots
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <p>Log in to access the Mountain Hut services.</p>
                        <div className="button-container">
                            <button onClick={() => navigate("/login")} className="nav-button">
                                Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

export default Home;
