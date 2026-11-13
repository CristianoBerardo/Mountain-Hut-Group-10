import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../api/authAPI";
import "../App.css";
import AuthTabs from "../components/AuthTabs";
import Navbar from "../components/Navbar";
import { auth } from "../config/firebase";
import "../styles/Login.css";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const from =(location.state as { from?: string } | null)?.from ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingGoogle, setLoadingGoogle] = useState(false);
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

            const token = await credentials.user.getIdToken();
            
            const response = await loginUser(token);

            const tokenWithRole = await credentials.user.getIdToken(true);

            console.log("User logged in successfully:", tokenWithRole);

            // Save JWT for subsequent API requests
            sessionStorage.setItem("jwt_token", tokenWithRole);
            sessionStorage.setItem("name", response.user.name);
            sessionStorage.setItem("role", response.user.role);
            sessionStorage.setItem("user_id", response.user.id);

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

    async function handleGoogleLogin() {
        setLoadingGoogle(true);
        setError("");

        try {
            const provider = new GoogleAuthProvider();

            const credentials = await signInWithPopup(auth, provider);

            const token = await credentials.user.getIdToken();

            try {
                const response = await loginUser(token);
                
                // Registered user, save JWT for subsequent API requests
                const tokenWithRole = await credentials.user.getIdToken(true);

                sessionStorage.setItem("jwt_token", tokenWithRole);

                console.log("User logged in successfully:", tokenWithRole);

                sessionStorage.setItem("name", response.user.name);
                sessionStorage.setItem("role", response.user.role);
            sessionStorage.setItem("user_id", response.user.id);

                navigate(from, { replace: true });
            }
            catch (err) {

                console.log("CAUGHT ERROR:", err);
                if (
                    err instanceof Error &&
                    err.message.includes("404")
                ) {
                    // Utente autenticato con Firebase, ma non registrato in PostgreSQL
                    navigate("/register", {
                        state: {
                            displayName: credentials.user.displayName || "",
                            email: credentials.user.email || "",
                            uid: credentials.user.uid,
                            provider: "google"
                        }
                    });
                    return;
                }
            }

        } catch (err) {
            console.error("Google login error:", err);

            setError(
                err instanceof Error
                    ? err.message
                    : "Google login failed"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <Navbar />
            <div className="login-container">
                <div className="login-card">

                    <AuthTabs />

                    <h1>Login</h1>

                    <p>Sign in to access the Mountain Hut System</p>

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

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="nav-button google-login-button"
                        disabled={loadingGoogle}
                    >
                        {loadingGoogle ? "Logging in with Google..." : "Login with Google"}
                    </button>

                    <Link to="/" className="back-link">
                        ← Back to Home
                    </Link>

                </div>
            </div>
        </div>
    );
}

export default Login;