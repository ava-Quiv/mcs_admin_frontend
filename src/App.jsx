
import { useCallback, useEffect, useMemo, useState } from "react";
import StatusIndicator from "./components/StatusIndicator";
import EditModal from "./components/EditModal";
import "./App.css";

const API_BASE_URL = "https://mcs-waybill-backend-2.onrender.com/api/bookings";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "Failed",
];

const PAYMENT_OPTIONS = [
  "Unpaid",
  "Pending",
  "Paid",
  "Refunded",
];

const TABS = [
  { key: "Pending", label: "Pending", icon: "⏳" },
  { key: "Confirmed", label: "Confirmed", icon: "✓" },
  { key: "In Transit", label: "In Transit", icon: "🚚" },
  { key: "Paid", label: "Paid", icon: "💰" },
  { key: "Refunded", label: "Refunded", icon: "↩" },
  { key: "ALL", label: "All Records", icon: "▦" },
];

function App() {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [connection, setConnection] = useState("checking");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const showMessage = useCallback((text) => {
    setMessage(text);
  }, []);

  // Fetch all bookings from the working GET endpoint.
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_BASE_URL, {
        headers: { Accept: "application/json" },
      });

      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : [];
      } catch {
        throw new Error(
          "The server did not return valid JSON."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          `Server returned HTTP ${response.status}.`
        );
      }

      if (!Array.isArray(data)) {
        throw new Error(
          "Expected an array of booking records."
        );
      }

      console.log("Bookings received from API:", data);

      setBookings(data);
      setConnection("online");
    } catch (err) {
      console.error("Fetch bookings error:", err);

      setConnection("offline");
      setError(
        err.message ||
        "Could not connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Apply tab and search filters locally.
  const displayedBookings = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      let matchesTab = true;

      if (activeTab === "Paid" || activeTab === "Refunded") {
        matchesTab =
          String(booking.paymentStatus || "Unpaid")
            .toLowerCase() === activeTab.toLowerCase();
      } else if (activeTab !== "ALL") {
        matchesTab =
          String(booking.status || "Pending")
            .toLowerCase() === activeTab.toLowerCase();
      }

      if (!matchesTab) return false;
      if (!query) return true;

      const searchableValues = [
        booking.bookingNumber,
        booking._id,
        booking.senderName,
        booking.senderPhone,
        booking.senderId,
        booking.senderEmail,
        booking.recipientName,
        booking.recipientPhone,
        booking.recipientId,
        booking.pickupAddress,
        booking.destination,
        booking.status,
        booking.paymentStatus,
      ];

      return searchableValues.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [bookings, activeTab, searchTerm]);

  // Send an update to PUT /api/bookings/:id.
  const saveBooking = async (id, changes) => {
    if (!id) {
      setError("Booking ID is missing.");
      return false;
    }

    setSavingId(id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/${encodeURIComponent(id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(changes),
        }
      );

      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.message ||
          `Update failed with HTTP ${response.status}.`
        );
      }

      // Update the local record immediately.
      setBookings((current) =>
        current.map((booking) =>
          booking._id === id
            ? {
                ...booking,
                ...(data.booking || data),
                ...changes,
              }
            : booking
        )
      );

      showMessage("Booking updated successfully.");

      // Reload from MongoDB to confirm the saved record.
      await fetchBookings();

      return true;
    } catch (err) {
      console.error("Booking update error:", err);
      setError(err.message || "Failed to update booking.");
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const handleStatusChange = async (booking, status) => {
    await saveBooking(booking._id, { status });
  };

  const handleSaveModalEdits = async (id, changes) => {
    const success = await saveBooking(id, changes);

    if (success) {
      setSelectedBooking(null);
    }
  };

  const formatCurrency = (amount) => {
    const number = Number(amount);

    if (amount === null || amount === undefined ||
        amount === "" || !Number.isFinite(number)) {
      return "KSh 0";
    }

    return `KSh ${number.toLocaleString("en-KE")}`;
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-icon">M</div>
            <div>
              <h1>MCS Waybill Hub</h1>
              <p>Courier management and booking administration</p>
            </div>
          </div>

          <label className="search-wrapper">
            <span className="search-icon">⌕</span>
            <input
              type="search"
              placeholder="Search waybill, name or phone..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />
          </label>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="summary-grid">
          <div className="summary-card">
            <div className="summary-icon blue">▦</div>
            <div>
              <span>Total bookings</span>
              <strong>{bookings.length}</strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon orange">⏳</div>
            <div>
              <span>Pending bookings</span>
              <strong>
                {bookings.filter(
                  (booking) =>
                    (booking.status || "Pending") === "Pending"
                ).length}
              </strong>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon green">✓</div>
            <div>
              <span>API connection</span>
              <strong className={`connection-${connection}`}>
                {connection === "online"
                  ? "Online"
                  : connection === "offline"
                  ? "Offline"
                  : "Checking..."}
              </strong>
            </div>
          </div>
        </section>

        <section className="dashboard-toolbar">
          <div className="tabs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`tab-button ${
                  activeTab === tab.key ? "active" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="refresh-button"
            onClick={() => {
              setMessage("");
              fetchBookings();
            }}
            disabled={loading}
          >
            <span>↻</span>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </section>

        {message && (
          <div className="alert success" role="status">
            <span>✓</span>
            {message}
            <button
              type="button"
              className="alert-close"
              onClick={() => setMessage("")}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="alert error" role="alert">
            <span>!</span>
            <div>
              <strong>Unable to complete the request</strong>
              <p>{error}</p>
            </div>
            <button
              type="button"
              className="alert-close"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        <section className="table-card">
          <div className="table-header">
            <div>
              <h2>Booking Records</h2>
              <p>
                Showing {displayedBookings.length} of{" "}
                {bookings.length} bookings
              </p>
            </div>

            <div className="table-status">
              <span
                className={`status-dot ${
                  connection !== "online" ? "offline" : ""
                }`}
              />
              {connection === "online"
                ? "API connected"
                : connection === "checking"
                ? "Connecting..."
                : "API unavailable"}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <h3>Loading bookings</h3>
              <p>Retrieving records from MongoDB...</p>
            </div>
          ) : displayedBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3>
                {error ? "Bookings could not be loaded" :
                  "No bookings found"}
              </h3>
              <p>
                {error
                  ? "Check the API connection and refresh the page."
                  : "Try another tab or search term."}
              </p>
              {error && (
                <button
                  type="button"
                  className="refresh-button"
                  onClick={fetchBookings}
                >
                  Try again
                </button>
              )}
            </div>
          ) : (
            <div className="table-container">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th>Waybill</th>
                    <th>Sender</th>
                    <th>Recipient</th>
                    <th>Route / Parcel</th>
                    <th>Delivery status</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Pickup date</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {displayedBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td>
                        <div className="waybill">
                          {booking.bookingNumber || "—"}
                        </div>
                        <small>ID: {booking._id || "—"}</small>
                      </td>

                      <td>
                        <div className="person-name">
                          {booking.senderName || "—"}
                        </div>
                        <small>ID: {booking.senderId || "—"}</small>
                        <small>☎ {booking.senderPhone || "—"}</small>
                        {booking.senderEmail && (
                          <small>{booking.senderEmail}</small>
                        )}
                      </td>

                      <td>
                        <div className="person-name">
                          {booking.recipientName || "—"}
                        </div>
                        <small>
                          ID: {booking.recipientId || "—"}
                        </small>
                        <small>
                          ☎ {booking.recipientPhone || "—"}
                        </small>
                      </td>

                      <td>
                        <div className="route">
                          <div>
                            <span>FROM</span>
                            {booking.pickupAddress ||
                              booking.pickup || "—"}
                          </div>
                          <div>
                            <span>TO</span>
                            {booking.destination || "—"}
                          </div>
                        </div>
                        {booking.parcelType && (
                          <small>
                            📦 {booking.parcelType}
                            {booking.weight
                              ? ` · ${booking.weight}`
                              : ""}
                          </small>
                        )}
                      </td>

                      <td>
                        <div className="status-cell">
                          <StatusIndicator
                            value={booking.status || "Pending"}
                            type="delivery"
                          />
                          <select
                            aria-label={`Delivery status for ${
                              booking.bookingNumber || booking._id
                            }`}
                            value={booking.status || "Pending"}
                            disabled={savingId === booking._id}
                            onChange={(event) =>
                              handleStatusChange(
                                booking,
                                event.target.value
                              )
                            }
                          >
                            {!STATUS_OPTIONS.includes(booking.status) &&
                              booking.status && (
                                <option value={booking.status}>
                                  {booking.status}
                                </option>
                              )}
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      <td>
                        <div
                          className={`payment-status ${
                            String(booking.paymentStatus || "Unpaid")
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                          }`}
                        >
                          {booking.paymentStatus || "Unpaid"}
                        </div>
                        {booking.paymentMethod && (
                          <small>{booking.paymentMethod}</small>
                        )}
                      </td>

                      <td>
                        <div className="amount">
                          {formatCurrency(
                            booking.deliveryFee ??
                            booking.totalAmount ??
                            booking.total
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="date">
                          {formatDate(
                            booking.pickupDate || booking.createdAt
                          )}
                        </div>
                        {booking.pickupTime && (
                          <small>🕒 {booking.pickupTime}</small>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() =>
                            setSelectedBooking(booking)
                          }
                        >
                          ✎ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <footer className="dashboard-footer">
        <span>MCS Waybill Hub</span>
        <span>Logistics Administration Console</span>
      </footer>

      {selectedBooking && (
        <EditModal
          key={selectedBooking._id}
          booking={selectedBooking}
          saving={savingId === selectedBooking._id}
          onClose={() => setSelectedBooking(null)}
          onSave={handleSaveModalEdits}
          statusOptions={STATUS_OPTIONS}
          paymentOptions={PAYMENT_OPTIONS}
        />
      )}
    </div>
  );
}

export default App;
