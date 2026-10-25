import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="home-container">
                <h1>Welcome to SE2 Ticketing System</h1>
                <p>Choose your action below:</p>
                <div className="button-container">
                    <button onClick={() => navigate("/get-ticket")} className="nav-button">
                        Go to Get Ticket Page
                    </button>
                    <button onClick={() => navigate("/see-stats")} className="nav-button">
                        Go to See Stats Page
                    </button>
                </div>
            </div>
            </>
    );
}

export default Home;