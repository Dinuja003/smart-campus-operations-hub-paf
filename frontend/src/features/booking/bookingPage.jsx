import { useMemo, useState } from "react";

const facilities = [
	"Library Discussion Room",
	"Computer Lab A",
	"Seminar Hall 2",
	"Basketball Court",
];

const timeSlots = [
	"08:00 - 09:00",
	"09:00 - 10:00",
	"10:00 - 11:00",
	"13:00 - 14:00",
	"14:00 - 15:00",
	"15:00 - 16:00",
];

function BookingPage() {
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
			studentName: "Aina Yusuf",
			facility: "Library Discussion Room",
			date: "2026-03-25",
			timeSlot: "10:00 - 11:00",
			purpose: "Group study discussion",
			status: "Approved",
		},
		{
			id: 2,
			studentName: "Daniel Wong",
			facility: "Computer Lab A",
			date: "2026-03-25",
			timeSlot: "13:00 - 14:00",
			purpose: "Programming assignment",
			status: "Pending",
		},
	]);

	const availabilityMessage = useMemo(() => {
		if (!formData.date) {
			return "Choose a date to check availability.";
		}

		const taken = bookings.some(
			(booking) =>
				booking.facility === formData.facility &&
				booking.date === formData.date &&
				booking.timeSlot === formData.timeSlot
		);

		return taken
			? "This slot is already booked. Pick another slot."
			: "This slot is available.";
	}, [bookings, formData.date, formData.facility, formData.timeSlot]);

	const onChange = (event) => {
		const { name, value } = event.target;
		setFormData((previous) => ({ ...previous, [name]: value }));
	};

	const onSubmit = (event) => {
		event.preventDefault();

		if (!formData.studentName || !formData.date || !formData.purpose) {
			alert("Please fill in all required fields.");
			return;
		}

		const duplicate = bookings.some(
			(booking) =>
				booking.facility === formData.facility &&
				booking.date === formData.date &&
				booking.timeSlot === formData.timeSlot
		);

		if (duplicate) {
			alert("Selected slot is unavailable. Choose another one.");
			return;
		}

		const newBooking = {
			id: Date.now(),
			...formData,
			status: "Pending",
		};

		setBookings((previous) => [newBooking, ...previous]);
		setFormData((previous) => ({
			...previous,
			studentName: "",
			date: "",
			purpose: "",
		}));
	};

	return (
		<div style={styles.page}>
			<h1 style={styles.title}>University Facility Booking</h1>
			<p style={styles.subtitle}>
				Reserve campus spaces for study sessions, events, and activities.
			</p>

			<div style={styles.grid}>
				<section style={styles.card}>
					<h2 style={styles.cardTitle}>New Booking</h2>
					<form onSubmit={onSubmit} style={styles.form}>
						<label style={styles.label}>
							Student Name *
							<input
								name="studentName"
								type="text"
								value={formData.studentName}
								onChange={onChange}
								placeholder="e.g. Sarah Lim"
								style={styles.input}
							/>
						</label>

						<label style={styles.label}>
							Facility
							<select
								name="facility"
								value={formData.facility}
								onChange={onChange}
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
								name="date"
								type="date"
								value={formData.date}
								onChange={onChange}
								style={styles.input}
							/>
						</label>

						<label style={styles.label}>
							Time Slot
							<select
								name="timeSlot"
								value={formData.timeSlot}
								onChange={onChange}
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
								onChange={onChange}
								rows={3}
								placeholder="Describe your booking purpose"
								style={{ ...styles.input, resize: "vertical" }}
							/>
						</label>

						<div
							style={{
								...styles.availability,
								color: availabilityMessage.includes("already") ? "#9c2f2f" : "#1f6d1f",
							}}
						>
							{availabilityMessage}
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
												backgroundColor:
													booking.status === "Approved" ? "#d7f5dd" : "#fff2c7",
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

export default BookingPage;
