import { useState } from "react"

const TEMP_USER_ID = "69c038632d897c2ee8880785"
const API_USERNAME = "user"

function getApiPassword() {
  let savedPassword = sessionStorage.getItem("apiPassword")

  if (!savedPassword) {
    savedPassword = prompt("Enter backend password")
    if (savedPassword) {
      sessionStorage.setItem("apiPassword", savedPassword)
    }
  }

  return savedPassword || ""
}

function CreateTicketPage() {
  const [formData, setFormData] = useState({
    resourceId: "",
    category: "HARDWARE",
    subject: "",
    description: "",
    priority: "HIGH",
    location: "",
    preferredContact: "",
  })

  const [files, setFiles] = useState([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || [])

    if (selectedFiles.length > 3) {
      setError("You can upload up to 3 images only.")
      return
    }

    setError("")
    setFiles(selectedFiles)
  }

  const handleReset = () => {
    setFormData({
      resourceId: "",
      category: "HARDWARE",
      subject: "",
      description: "",
      priority: "HIGH",
      location: "",
      preferredContact: "",
    })
    setFiles([])
    setMessage("")
    setError("")
  }

  const handleUpdatePassword = () => {
    sessionStorage.removeItem("apiPassword")
    const newPassword = prompt("Enter new backend password")
    if (newPassword) {
      sessionStorage.setItem("apiPassword", newPassword)
      setMessage("Backend password updated successfully.")
      setError("")
    }
  }

  const validateForm = () => {
    if (!formData.subject.trim()) return "Subject is required."
    if (!formData.description.trim()) return "Description is required."
    if (!formData.location.trim()) return "Location is required."
    if (!formData.preferredContact.trim()) return "Preferred contact is required."
    if (files.length > 3) return "You can upload up to 3 images only."
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const validationError = validateForm()
      if (validationError) {
        throw new Error(validationError)
      }

      const apiPassword = getApiPassword()
      if (!apiPassword) {
        throw new Error("Backend password is required to continue.")
      }

      const form = new FormData()
      form.append("userId", TEMP_USER_ID)
      form.append("category", formData.category)
      form.append("subject", formData.subject.trim())
      form.append("description", formData.description.trim())
      form.append("priority", formData.priority)
      form.append("location", formData.location.trim())
      form.append("preferredContact", formData.preferredContact.trim())

      if (formData.resourceId.trim()) {
        form.append("resourceId", formData.resourceId.trim())
      }

      files.forEach((file) => {
        form.append("attachments", file)
      })

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          Authorization: "Basic " + btoa(`${API_USERNAME}:${apiPassword}`),
        },
        body: form,
      })

      if (!response.ok) {
        const text = await response.text()

        if (response.status === 401) {
          sessionStorage.removeItem("apiPassword")
          throw new Error("Unauthorized. Backend password may have changed after restart.")
        }

        throw new Error(text || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setMessage(`Ticket created successfully. Ticket ID: ${data.id}`)
      handleReset()
    } catch (err) {
      console.error("Create ticket error:", err)
      setError(err.message || "Failed to create ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div
        style={{
          borderRadius: "20px",
          background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #7c3aed 100%)",
          padding: "28px",
          color: "#fff",
          boxShadow: "0 20px 50px rgba(37, 99, 235, 0.25)",
        }}
      >
        <div style={{ fontSize: "14px", opacity: 0.9, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Maintenance & Incident Module
        </div>

        <h2 style={{ margin: "10px 0 8px", fontSize: "30px", lineHeight: 1.1 }}>
          Create Ticket
        </h2>

        <p style={{ margin: 0, maxWidth: "700px", color: "rgba(255,255,255,0.9)" }}>
          Report hardware, software, network, or facility issues clearly so the maintenance team can respond faster.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 280px) 1fr", gap: "24px" }}>
        <div
          style={{
            borderRadius: "20px",
            background: "#ffffff",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
            height: "fit-content",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", color: "#1e293b" }}>
            Guidelines
          </h3>

          <div style={{ display: "grid", gap: "12px", color: "#64748b", fontSize: "14px", lineHeight: 1.7 }}>
            <div>• A temporary dummy user ID is used until session/login is implemented.</div>
            <div>• You can upload up to 3 image attachments.</div>
            <div>• Use the correct resource ID if available.</div>
            <div>• Keep the subject short and clear.</div>
            <div>• Explain the issue properly in description.</div>
          </div>

          <div
            style={{
              marginTop: "18px",
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              fontSize: "13px",
              wordBreak: "break-all",
            }}
          >
            Temporary user ID: {TEMP_USER_ID}
          </div>

          <button
            type="button"
            onClick={handleUpdatePassword}
            style={{
              marginTop: "16px",
              width: "100%",
              padding: "12px 16px",
              background: "#e0e7ff",
              color: "#3730a3",
              border: "none",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Update Backend Password
          </button>
        </div>

        <div
          style={{
            borderRadius: "20px",
            background: "#ffffff",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            padding: "24px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Resource ID</label>
                <input
                  type="text"
                  name="resourceId"
                  value={formData.resourceId}
                  onChange={handleChange}
                  placeholder="Enter resource ObjectId (optional)"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                  <option value="HARDWARE">HARDWARE</option>
                  <option value="SOFTWARE">SOFTWARE</option>
                  <option value="NETWORK">NETWORK</option>
                  <option value="FACILITY">FACILITY</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleChange} style={inputStyle}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Preferred Contact</label>
                <input
                  type="text"
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleChange}
                  placeholder="Example: 0771234567"
                  style={inputStyle}
                  required
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Example: Monitor not working"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the issue clearly..."
                style={{ ...inputStyle, minHeight: "130px", resize: "vertical" }}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Example: Lab A-105"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>Attachments (up to 3 images)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                style={inputStyle}
              />
            </div>

            {message && (
              <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#dcfce7", color: "#166534", border: "1px solid #86efac" }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{ padding: "14px 16px", borderRadius: "12px", background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5", whiteSpace: "pre-wrap" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button
                type="button"
                onClick={handleReset}
                style={{
                  padding: "12px 18px",
                  background: "#e2e8f0",
                  color: "#0f172a",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 20px",
                  background: "linear-gradient(90deg, #2563eb, #7c3aed)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontWeight: "700",
                  cursor: "pointer",
                  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                }}
              >
                {loading ? "Submitting..." : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#334155",
}

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  background: "#f8fafc",
  color: "#0f172a",
  fontSize: "14px",
  boxSizing: "border-box",
  outline: "none",
}

export default CreateTicketPage