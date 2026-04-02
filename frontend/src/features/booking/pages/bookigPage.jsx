import React, { useMemo, useState } from "react";

const facilities = [
	"Library Discussion Room",
	"Computer Lab A",
	"Indoor Basketball Court",
	"Seminar Hall 2",
];

const timeSlots = [
	"08:00 - 09:00",
	"09:00 - 10:00",
	"10:00 - 11:00",
	"13:00 - 14:00",
	"14:00 - 15:00",
	"15:00 - 16:00",
];

function BookigPage() {
	const [formData, setFormData] = useState({
		studentName: "",
		facility: facilities[0],
		date: "",
		timeSlot: timeSlots[0],
		purpose: "",
	});

	const [bookings, setBookings] = useState([
		{
			id: 1,
			studentName: "Shanaka Kalubowilage",
			facility: "Library Discussion Room",
			date: "2026-03-16",
			timeSlot: "10:00 - 11:00",
			purpose: "Group study prep",
			status: "Approved",
		},
		{
			id: 2,
			studentName: "Kavin Tan",
			facility: "Computer Lab A",
			date: "2026-03-16",
			timeSlot: "13:00 - 14:00",
			purpose: "Programming assignment",
			status: "Pending",
		},
	]);

	const availabilityText = useMemo(() => {
		if (!formData.date) {
			return "Pick a date to check availability.";
		}

		const isTaken = bookings.some(
			(booking) =>
				booking.facility === formData.facility &&
				booking.date === formData.date &&
				booking.timeSlot === formData.timeSlot
		);

		return isTaken
			? "Selected slot is already booked. Please choose another time."
			: "Selected slot is available.";
	}, [bookings, formData.date, formData.facility, formData.timeSlot]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (event) => {
		event.preventDefault();

		if (!formData.studentName || !formData.date || !formData.purpose) {
			alert("Please fill in all required fields.");
			return;
		}

		const isDuplicate = bookings.some(
			(booking) =>
				booking.facility === formData.facility &&
				booking.date === formData.date &&
				booking.timeSlot === formData.timeSlot
		);

		if (isDuplicate) {
			alert("This slot is unavailable. Please choose another slot.");
			return;
		}

		const newBooking = {
			id: Date.now(),
			...formData,
			status: "Pending",
		};

		setBookings((prev) => [newBooking, ...prev]);
		setFormData((prev) => ({
			...prev,
			studentName: "",
			date: "",
			purpose: "",
		}));
	};

	return (
		<div style={styles.page}>
			<div style={styles.header}>
				<h1 style={styles.title}>Facility Booking</h1>
				<p style={styles.subtitle}>Reserve campus spaces for classes, events, and study sessions</p>
			</div>

			<div style={styles.grid}>
				<section style={styles.card}>
					<h2 style={styles.cardTitle}>Book a Facility</h2>
					<form onSubmit={handleSubmit} style={styles.form}>
						<label style={styles.label}>
							Student Name <span style={{color: "#ef4444"}}>*</span>
							<input
								type="text"
								name="studentName"
								value={formData.studentName}
								onChange={handleChange}
								placeholder="e.g. Sarah Lim"
								style={styles.input}
								onFocus={(e) => (e.target.style.borderColor = "#1f2937")}
								onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
							/>
						</label>

						<label style={styles.label}>
							Facility
							<select
								name="facility"
								value={formData.facility}
								onChange={handleChange}
								style={styles.input}
								onFocus={(e) => (e.target.style.borderColor = "#1f2937")}
								onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
							>
								{facilities.map((facility) => (
									<option key={facility} value={facility}>
										{facility}
									</option>
								))}
							</select>
						</label>

						<label style={styles.label}>
							Date <span style={{color: "#ef4444"}}>*</span>
							<input
								type="date"
								name="date"
								value={formData.date}
								onChange={handleChange}
								style={styles.input}
								onFocus={(e) => (e.target.style.borderColor = "#1f2937")}
								onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
							/>
						</label>

						<label style={styles.label}>
							Time Slot
							<select
								name="timeSlot"
								value={formData.timeSlot}
								onChange={handleChange}
								style={styles.input}
								onFocus={(e) => (e.target.style.borderColor = "#1f2937")}
								onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
							>
								{timeSlots.map((slot) => (
									<option key={slot} value={slot}>
										{slot}
									</option>
								))}
							</select>
						</label>

						<label style={styles.label}>
							Purpose <span style={{color: "#ef4444"}}>*</span>
							<textarea
								name="purpose"
								value={formData.purpose}
								onChange={handleChange}
								rows={3}
								placeholder="Describe why you need this booking"
								style={{ ...styles.input, resize: "vertical" }}
								onFocus={(e) => (e.target.style.borderColor = "#1f2937")}
								onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
							/>
						</label>

						<div
							style={{
								...styles.availability,
								backgroundColor: availabilityText.includes("unavailable") || availabilityText.includes("already")
									? "#fee2e2"
									: "#ecfdf5",
								color: availabilityText.includes("unavailable") || availabilityText.includes("already")
									? "#b91c1c"
									: "#065f46",
							}}
						>
							{availabilityText}
						</div>

						<button 
							type="submit" 
							style={styles.button}
							onMouseEnter={(e) => (e.target.style.backgroundColor = "#111827")}
							onMouseLeave={(e) => (e.target.style.backgroundColor = "#1f2937")}
						>
							Book Facility
						</button>
					</form>
				</section>

				<section style={styles.card}>
					<h2 style={styles.cardTitle}>Your Bookings</h2>
					{bookings.length === 0 ? (
						<p style={styles.emptyText}>No bookings yet. Create one to get started.</p>
					) : (
						<ul style={styles.list}>
							{bookings.map((booking) => (
								<li 
									key={booking.id} 
									style={styles.listItem}
									onMouseEnter={(e) => {
										e.currentTarget.style.borderColor = "#d1d5db";
										e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.07)";
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.borderColor = "#e5e7eb";
										e.currentTarget.style.boxShadow = "none";
									}}
								>
									<div style={styles.listRow}>
										<div>
											<div style={{fontWeight: "600", color: "#111827", marginBottom: "2px"}}>{booking.studentName}</div>
											<div style={{fontSize: "13px", color: "#6b7280"}}>{booking.facility}</div>
										</div>
										<span
											style={{
												...styles.badge,
												backgroundColor: booking.status === "Approved" ? "#d1fae5" : "#fef3c7",
												color: booking.status === "Approved" ? "#065f46" : "#92400e",
											}}
										>
											{booking.status}
										</span>
									</div>
									<div style={{display: "flex", gap: "16px", marginTop: "10px", fontSize: "13px", color: "#6b7280"}}>
										<div>
											<span style={{fontWeight: "500", color: "#374151"}}>Date:</span> {booking.date}
										</div>
										<div>
											<span style={{fontWeight: "500", color: "#374151"}}>Time:</span> {booking.timeSlot}
										</div>
									</div>
									<div style={styles.purposeText}><span style={{fontWeight: "500", color: "#374151"}}>Purpose:</span> {booking.purpose}</div>
								</li>
							))}
						</ul>
					)}
				</section>
			</div>
		</div>
	);
}

const styles = {
	page: {
		maxWidth: "1200px",
		margin: "0 auto",
		padding: "32px 24px",
		fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
		color: "#1f2937",
		background: "#f9fafb",
		minHeight: "100vh",
	},
	header: {
		marginBottom: "40px",
		paddingBottom: "24px",
		borderBottom: "1px solid #e5e7eb",
	},
	title: {
		fontSize: "32px",
		fontWeight: "700",
		margin: "0 0 8px 0",
		color: "#111827",
		letterSpacing: "-0.5px",
	},
	subtitle: {
		fontSize: "16px",
		color: "#6b7280",
		margin: "0",
		fontWeight: "400",
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
		gap: "32px",
	},
	card: {
		border: "1px solid #e5e7eb",
		borderRadius: "12px",
		backgroundColor: "#ffffff",
		padding: "28px",
		boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
		transition: "box-shadow 0.3s ease, border-color 0.3s ease",
	},
	cardTitle: {
		fontSize: "20px",
		fontWeight: "600",
		marginTop: "0",
		marginBottom: "20px",
		color: "#111827",
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: "18px",
	},
	label: {
		display: "flex",
		flexDirection: "column",
		gap: "8px",
		fontSize: "14px",
		fontWeight: "500",
		color: "#374151",
	},
	input: {
		border: "1px solid #d1d5db",
		borderRadius: "8px",
		padding: "10px 12px",
		fontSize: "14px",
		transition: "border-color 0.2s ease, box-shadow 0.2s ease",
		boxSizing: "border-box",
		fontFamily: "inherit",
	},
	availability: {
		fontWeight: "600",
		fontSize: "13px",
		padding: "12px",
		borderRadius: "8px",
		marginTop: "4px",
	},
	button: {
		backgroundColor: "#1f2937",
		color: "#ffffff",
		border: "none",
		padding: "12px 16px",
		borderRadius: "8px",
		cursor: "pointer",
		fontWeight: "600",
		fontSize: "14px",
		transition: "background-color 0.2s ease, transform 0.1s ease",
		marginTop: "8px",
	},
	list: {
		listStyle: "none",
		padding: "0",
		margin: "0",
		display: "flex",
		flexDirection: "column",
		gap: "12px",
	},
	listItem: {
		border: "1px solid #e5e7eb",
		borderRadius: "10px",
		padding: "16px",
		backgroundColor: "#ffffff",
		fontSize: "14px",
		transition: "border-color 0.2s ease, box-shadow 0.2s ease",
	},
	listRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "8px",
	},
	badge: {
		fontSize: "11px",
		padding: "4px 10px",
		borderRadius: "6px",
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: "0.5px",
	},
	purposeText: {
		marginTop: "8px",
		color: "#6b7280",
		fontSize: "13px",
		lineHeight: "1.5",
	},
	emptyText: {
		color: "#9ca3af",
		fontSize: "15px",
		padding: "20px",
		textAlign: "center",
	},
};

export default BookigPage;
