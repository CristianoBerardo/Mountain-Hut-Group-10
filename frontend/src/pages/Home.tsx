import { ArrowDown, ArrowRight, Compass, MapPin, Mountain, Route } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import { canBookTable, canManageSlots } from "../utils/roles";

function Home() {
    const isLoggedIn = !!sessionStorage.getItem("jwt_token");
    const role = sessionStorage.getItem("role");

    return (
        <div className="landing-page">
            <Navbar />

            <main>
                <section className="landing-hero" aria-labelledby="hero-title">
                    <div className="hero-landscape" aria-hidden="true">
                        <div className="hero-sun" />
                        <div className="hero-mountain hero-mountain-back" />
                        <div className="hero-mountain hero-mountain-front" />
                    </div>
                    <div className="hero-content">
                        <p className="eyebrow"><Mountain size={16} /> YOUR MOUNTAIN ESCAPE</p>
                        <h1 id="hero-title">A place to pause.<br />A starting point to explore.</h1>
                        <p className="hero-description">
                            Slow down, take in the mountain air, and make the most of your time outdoors.
                            Our hut is a welcoming stop for hikers and a base for the trails beyond.
                        </p>
                        <div className="hero-actions">
                            {isLoggedIn && canBookTable(role) ? (
                                <Link className="landing-button landing-button-primary" to="/book">
                                    Book a table <ArrowRight size={18} />
                                </Link>
                            ) : !isLoggedIn ? (
                                <Link className="landing-button landing-button-primary" to="/login">
                                    Plan your visit <ArrowRight size={18} />
                                </Link>
                            ) : null}
                            <a className="landing-button landing-button-secondary" href="#visit">
                                Discover the hut <ArrowDown size={18} />
                            </a>
                            {isLoggedIn && canManageSlots(role) && (
                                <Link className="landing-button landing-button-secondary" to="/slots">
                                    Manage meal slots <ArrowRight size={18} />
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hero-caption">
                        <span className="caption-line" />
                        <span>THE MOUNTAINS ARE CLOSER THAN YOU THINK</span>
                        <span className="caption-line" />
                    </div>
                </section>

                <section className="welcome-section" id="visit">
                    <div className="section-heading">
                        <p className="eyebrow">WELCOME TO THE HUT</p>
                        <h2>More than a place to stay</h2>
                    </div>
                    <p className="welcome-copy">
                        Whether you are stopping in for a meal or setting out on a longer adventure,
                        a mountain hut offers a chance to reconnect with nature and enjoy the journey
                        at your own pace. Come for the views, stay for the warm welcome.
                    </p>
                </section>

                <section className="visit-section" aria-label="Plan your visit">
                    <article className="visit-card">
                        <div className="visit-icon"><MapPin size={22} /></div>
                        <p className="eyebrow">FIND US</p>
                        <h3>In the heart of the mountains</h3>
                        <p>
                            Set in an alpine landscape, the hut is a place to take a breath and
                            enjoy the surroundings. Check local maps for the best starting point.
                        </p>
                    </article>
                    <article className="visit-card">
                        <div className="visit-icon"><Route size={22} /></div>
                        <p className="eyebrow">GETTING HERE</p>
                        <h3>Take the scenic route</h3>
                        <p>
                            Reach the hut by following the marked paths from the valley. Before
                            setting out, check trail conditions and choose a route suited to your plans.
                        </p>
                    </article>
                    <article className="visit-card">
                        <div className="visit-icon"><Compass size={22} /></div>
                        <p className="eyebrow">EXPLORE</p>
                        <h3>Step into the outdoors</h3>
                        <p>
                            Discover walking trails, mountain viewpoints, and the peaks and natural
                            landscapes surrounding the hut.
                        </p>
                    </article>
                </section>

                <section className="landing-cta">
                    <div>
                        <p className="eyebrow">MAKE A DAY OF IT</p>
                        <h2>Your next mountain moment starts here.</h2>
                    </div>
                    {(!isLoggedIn || canBookTable(role)) && (
                        <Link className="landing-button landing-button-light" to={isLoggedIn ? "/book" : "/login"}>
                            {isLoggedIn ? "Book a table" : "Join us at the hut"}
                            <ArrowRight size={18} />
                        </Link>
                    )}
                </section>
            </main>

            <footer className="landing-footer">
                <span> </span>
                <span>@ Politecnico di Torino</span>
            </footer>
        </div>
    );
}

export default Home;
