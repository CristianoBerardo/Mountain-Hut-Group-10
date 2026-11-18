import Navbar from "../components/Navbar";
import "../styles/BookTable.css";

function CheckAvailability() {
    return (
        <div className="book-table-page">
            <Navbar />
            <main className="client-booking">
                <section className="client-card" aria-labelledby="availability-title">
                    <h1 id="availability-title">Check table availability</h1>
                    <p className="client-lead">
                        Check whether we can accommodate your party for a selected date and time.
                    </p>
                    <p className="client-note">
                        Availability checking will be available soon.
                    </p>
                </section>
            </main>
        </div>
    );
}

export default CheckAvailability;
