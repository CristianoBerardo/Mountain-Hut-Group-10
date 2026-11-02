import { UserRound, UserRoundPlus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "../styles/AuthTabs.css";

function AuthTabs() {
const location = useLocation();

const isLogin = location.pathname === "/login";

return (
    <div className="auth-tabs">
        <Link
            to="/login"
            className={`auth-tab ${isLogin ? "active" : ""}`}
        >
            <UserRound size={20} />
            <span>Login</span>
        </Link>

        <Link
            to="/register"
            className={`auth-tab ${!isLogin ? "active" : ""}`}
        >
            <UserRoundPlus size={20} />
            <span>Register</span>
        </Link>
    </div>
);

}

export default AuthTabs;
