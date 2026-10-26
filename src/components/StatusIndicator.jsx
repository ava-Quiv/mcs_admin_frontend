
function StatusIndicator({ value = "Pending" }) {
  const statusClass = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (
    <span className={`status-badge status-${statusClass}`}>
      <span className="status-badge-dot" />
      {value}
    </span>
  );
}

export default StatusIndicator;
