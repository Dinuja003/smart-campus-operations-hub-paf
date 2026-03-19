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
			studentName: "Aisha Rahman",
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
			<h1 style={styles.title}>Facility Booking</h1>
			<p style={styles.subtitle}>Reserve campus spaces for classes, events, and study sessions.</p>

			<div style={styles.grid}>
				<section style={styles.card}>
					<h2 style={styles.cardTitle}>Create Booking</h2>
					<form onSubmit={handleSubmit} style={styles.form}>
						<label style={styles.label}>
							Student Name *
							<input
								type="text"
								name="studentName"
								value={formData.studentName}
								onChange={handleChange}
								placeholder="e.g. Sarah Lim"
								style={styles.input}
							/>
						</label>

						<label style={styles.label}>
							Facility
							<select
								name="facility"
								value={formData.facility}
								onChange={handleChange}
								style={styles.input}
							>
								{facilities.map((facility) => (
									<option key={facility} value={facility}>
										{facility}
									</option>
								))}
							</select>
						</label>

						<label style={styles.label}>
							Date *
							<input
								type="date"
								name="date"
								value={formData.date}
								onChange={handleChange}
								style={styles.input}
							/>
						</label>

						<label style={styles.label}>
							Time Slot
							<select
								name="timeSlot"
								value={formData.timeSlot}
								onChange={handleChange}
								style={styles.input}
							>
								{timeSlots.map((slot) => (
									<option key={slot} value={slot}>
										{slot}
									</option>
								))}
							</select>
						</label>

						<label style={styles.label}>
							Purpose *
							<textarea
								name="purpose"
								value={formData.purpose}
								onChange={handleChange}
								rows={3}
								placeholder="Describe why you need this booking"
								style={{ ...styles.input, resize: "vertical" }}
							/>
						</label>

						<div
							style={{
								...styles.availability,
								color: availabilityText.includes("unavailable") || availabilityText.includes("already")
									? "#9c2f2f"
									: "#1f6d1f",
							}}
						>
							{availabilityText}
						</div>

						<button type="submit" style={styles.button}>
							Submit Booking
						</button>
					</form>
				</section>

				<section style={styles.card}>
					<h2 style={styles.cardTitle}>Recent Bookings</h2>
					{bookings.length === 0 ? (
						<p style={styles.emptyText}>No bookings yet.</p>
					) : (
						<ul style={styles.list}>
							{bookings.map((booking) => (
								<li key={booking.id} style={styles.listItem}>
									<div style={styles.listRow}>
										<strong>{booking.studentName}</strong>
										<span
											style={{
												...styles.badge,
												backgroundColor: booking.status === "Approved" ? "#d7f5dd" : "#fff2c7",
												color: booking.status === "Approved" ? "#0f5b1f" : "#7a5200",
											}}
										>
											{booking.status}
										</span>
									</div>
									<div>{booking.facility}</div>
									<div>
										{booking.date} | {booking.timeSlot}
									</div>
									<div style={styles.purposeText}>{booking.purpose}</div>
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
		maxWidth: "1100px",
		margin: "0 auto",
		padding: "24px",
		fontFamily: "Segoe UI, sans-serif",
		color: "#1b1b1b",
		background: "linear-gradient(180deg, #f6fbff 0%, #ffffff 100%)",
		minHeight: "100vh",
	},
	title: {
		marginBottom: "4px",
	},
	subtitle: {
		marginTop: 0,
		color: "#4a4a4a",
		marginBottom: "20px",
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
		gap: "20px",
	},
	card: {
		border: "1px solid #d8e3f0",
		borderRadius: "12px",
		backgroundColor: "#ffffff",
		padding: "18px",
		boxShadow: "0 6px 20px rgba(0, 0, 0, 0.06)",
	},
	cardTitle: {
		marginTop: 0,
		marginBottom: "12px",
	},
	form: {
		display: "flex",
		flexDirection: "column",
		gap: "12px",
	},
	label: {
		display: "flex",
		flexDirection: "column",
		gap: "6px",
		fontSize: "14px",
	},
	input: {
		border: "1px solid #c9d6e5",
		borderRadius: "8px",
		padding: "10px",
		fontSize: "14px",
	},
	availability: {
		fontWeight: 600,
		fontSize: "14px",
	},
	button: {
		backgroundColor: "#0b5ed7",
		color: "#ffffff",
		border: "none",
		padding: "10px 14px",
		borderRadius: "8px",
		cursor: "pointer",
		fontWeight: 600,
	},
	list: {
		listStyle: "none",
		padding: 0,
		margin: 0,
		display: "flex",
		flexDirection: "column",
		gap: "10px",
	},
	listItem: {
		border: "1px solid #e2e8f0",
		borderRadius: "10px",
		padding: "12px",
		backgroundColor: "#fbfdff",
		fontSize: "14px",
	},
	listRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: "4px",
	},
	badge: {
		fontSize: "12px",
		padding: "2px 8px",
		borderRadius: "999px",
		fontWeight: 700,
	},
	purposeText: {
		marginTop: "6px",
		color: "#3d3d3d",
	},
	emptyText: {
		color: "#6b7280",
	},
};

export default BookigPage;
