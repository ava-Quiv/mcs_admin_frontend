
import { useState } from "react";

function EditModal({
  booking,
  onClose,
  onSave,
  saving = false,
  statusOptions = [],
  paymentOptions = [],
}) {
  const [form, setForm] = useState({
    senderName: booking.senderName || "",
    senderPhone: booking.senderPhone || "",
    senderEmail: booking.senderEmail || "",
    senderId: booking.senderId || "",
    pickupAddress: booking.pickupAddress || "",
    destination: booking.destination || "",
    recipientName: booking.recipientName || "",
    recipientPhone: booking.recipientPhone || "",
    recipientId: booking.recipientId || "",
    parcelType: booking.parcelType || "",
    weight: booking.weight || "",
    description: booking.description || "",
    notes: booking.notes || "",
    status: booking.status || "Pending",
    paymentStatus: booking.paymentStatus || "Unpaid",
    paymentMethod: booking.paymentMethod || "",
    deliveryFee: booking.deliveryFee ?? 0,
    pickupDate: booking.pickupDate
      ? String(booking.pickupDate).slice(0, 10)
      : "",
    pickupTime: booking.pickupTime || "",
  });

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    await onSave(booking._id, {
      ...form,
      deliveryFee: Number(form.deliveryFee),
    });
  };

  const fields = [
    ["senderName", "Sender name", "text"],
    ["senderPhone", "Sender phone", "tel"],
    ["senderEmail", "Sender email", "email"],
    ["senderId", "Sender ID number", "text"],
    ["recipientName", "Recipient name", "text"],
    ["recipientPhone", "Recipient phone", "tel"],
    ["recipientId", "Recipient ID number", "text"],
    ["pickupAddress", "Pickup address", "text"],
    ["destination", "Destination", "text"],
    ["parcelType", "Parcel type", "text"],
    ["weight", "Parcel weight", "text"],
    ["deliveryFee", "Delivery fee (KSh)", "number"],
    ["pickupDate", "Pickup date", "date"],
    ["pickupTime", "Pickup time", "time"],
  ];

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        className="edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
      >
        <div className="modal-header">
          <div>
            <h2 id="edit-modal-title">Edit booking</h2>
            <p>{booking.bookingNumber || booking._id}</p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit form"
          >
            ×
          </button>
        </div>

        <form onSubmit={submitForm}>
          <div className="modal-fields">
            {fields.map(([name, label, type]) => (
              <label className="form-field" key={name}>
                <span>{label}</span>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={updateField}
                  min={type === "number" ? "0" : undefined}
                  required={[
                    "senderName",
                    "senderPhone",
                    "recipientName",
                    "recipientPhone",
                    "pickupAddress",
                    "destination",
                  ].includes(name)}
                />
              </label>
            ))}

            <label className="form-field">
              <span>Delivery status</span>
              <select
                name="status"
                value={form.status}
                onChange={updateField}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Payment status</span>
              <select
                name="paymentStatus"
                value={form.paymentStatus}
                onChange={updateField}
              >
                {!paymentOptions.includes(form.paymentStatus) && (
                  <option value={form.paymentStatus}>
                    {form.paymentStatus}
                  </option>
                )}
                {paymentOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Payment method</span>
              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={updateField}
              >
                <option value="">Select method</option>
                <option value="M-Pesa">M-Pesa</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                {!["M-Pesa", "Cash", "Card", ""].includes(
                  form.paymentMethod
                ) && (
                  <option value={form.paymentMethod}>
                    {form.paymentMethod}
                  </option>
                )}
              </select>
            </label>

            <label className="form-field full-width">
              <span>Description</span>
              <textarea
                name="description"
                value={form.description}
                onChange={updateField}
                rows={2}
              />
            </label>

            <label className="form-field full-width">
              <span>Additional notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={updateField}
                rows={3}
              />
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditModal;
