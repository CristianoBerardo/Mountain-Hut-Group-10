import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { signInWithEmailAndPassword } from "firebase/auth/web-extension";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../api/authAPI";
import "../App.css";
import Navbar from "../components/Navbar";
import { auth } from "../config/firebase";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const from =(location.state as { from?: string } | null)?.from ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setError("");

        try {
            // Firebase login
            const credentials = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Firebase login OK:", credentials.user.uid);

            const token = await credentials.user.getIdToken();

            console.log("Firebase token obtained");
            
            const response = await loginUser(token);

            console.log("Backend response:", response);

            // Save JWT for subsequent API requests
            sessionStorage.setItem("jwt_token", response.token);
            sessionStorage.setItem("name", response.user.name);
            sessionStorage.setItem("role", response.user.role);

            navigate(from, { replace: true });

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Login failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Navbar />
            <div className="login-container">
                <div className="login-card">

                    <h1>Login</h1>

                    <p>Sign in to access the Ticket System</p>

                    <form onSubmit={handleLogin} className="login-form">

                        <div className="form-group">
                            <label htmlFor="username">Username</label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>

                            <div className="password-input-container">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"} >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <p className="login-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="nav-button login-button"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <Link to="/" className="back-link">
                        ← Back to Home
                    </Link>

                </div>
            </div>
        </>
    );
}

export default Login;