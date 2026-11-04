import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
    const navigate = useNavigate();

    return (
        <>
            <Navbar />
            <div className="home-container">
                <h1>Welcome to the Mountain Hut</h1>
                <p>Choose your action below:</p>
                <div className="button-container">
                    <button onClick={() => navigate("/book")} className="nav-button">
                        Book a Table
                    </button>
                </div>
            </div>
            </>
    );
}

export default Home;