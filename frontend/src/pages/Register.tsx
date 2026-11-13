import {
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  Phone,
  PhoneCall,
  User,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { registerUser } from "../api/authAPI";
import "../App.css";
import AuthTabs from "../components/AuthTabs";
import Navbar from "../components/Navbar";
import { auth } from "../config/firebase";
import "../styles/AuthTabs.css";
import "../styles/Register.css";
import { createUserWithEmailAndPassword } from "firebase/auth";

function Register() {
  const location = useLocation();
  const navigate = useNavigate();

  const fullName = location.state?.displayName?.trim() || "";
  const nameParts = fullName.split(/\s+/);

  const isGoogleRegistration = location.state?.provider === "google";

  const [name, setName] = useState(nameParts[0] || "");
  const [surname, setSurname] = useState(
    nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
  );
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword && !isGoogleRegistration) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6 && !isGoogleRegistration) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      let credentials;
      let token;

      if (!isGoogleRegistration) {
        // Create Firebase account
        credentials = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        console.log("Firebase registration OK:", credentials.user.uid);

        // Get Firebase ID Token
        token = await credentials.user.getIdToken();
      } else {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          setError("No authenticated user found for Google registration.");
          setLoading(false);
          return;
        }

        token = await currentUser.getIdToken();
      }

      console.log("Firebase token obtained");

      // Register user in PostgreSQL through backend
      const response = await registerUser(token, {
        name,
        surname,
        email,
        mobile_number: mobileNumber,
        notes,
        emergency_contact: emergencyContact,
      });

      console.log("Backend response:", response);

      // Save session information
      sessionStorage.setItem("jwt_token", response.token);
      sessionStorage.setItem("name", response.user.name);
      sessionStorage.setItem("role", response.user.role);
      sessionStorage.setItem("user_id", response.user.id);

      // Navigate to home
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);

      const firebaseError = err as { code?: string };

      if (firebaseError.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (firebaseError.code === "auth/weak-password") {
        setError("Password is too weak.");
      } else if (firebaseError.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err instanceof Error ? err.message : "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-page">
      <Navbar />

      <div className="register-container">
        <div className="register-card">
          <AuthTabs />

          <h1>Register</h1>
          <p>Create an account to access the Mountain Hut System</p>

          <form onSubmit={handleRegister} className="register-form">
            <div className="form-group">
              <div className="input-icon-container">
                <User size={20} />
                <input
                  placeholder="First Name *"
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-container">
                <UserRound size={20} />
                <input
                  placeholder="Last Name *"
                  id="surname"
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-container">
                <Mail size={20} />
                <input
                  placeholder="Email *"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {!isGoogleRegistration && (
              <>
                <div className="form-group">
                  <div className="password-input-container">
                    <div className="input-icon-container">
                      <LockKeyhole size={20} />
                      <input
                        placeholder="Password *"
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required={!isGoogleRegistration}
                      />
                    </div>

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <div className="password-input-container">
                    <div className="input-icon-container">
                      <LockKeyhole size={20} />
                      <input
                        placeholder="Confirm Password *"
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required={!isGoogleRegistration}
                      />
                    </div>

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <div className="input-icon-container">
                <Phone size={20} />
                <input
                  placeholder="Mobile Number *"
                  id="mobileNumber"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-container">
                <PhoneCall size={20} />
                <input
                  placeholder="Emergency Contact"
                  id="emergencyContact"
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-container textarea-container">
                <FileText size={20} />
                <textarea
                  placeholder="Notes (optional)"
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {error && (
              <p className="register-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="nav-button register-button"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="register-login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>

          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
