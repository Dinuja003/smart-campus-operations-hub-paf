package com.smartcampus.backend.features.email.service;

import com.smartcampus.backend.features.booking.model.Booking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Async
    public void sendBookingStatusEmail(String toEmail, String userName, Booking booking, boolean approved) {
        String statusWord = approved ? "Approved" : "Rejected";
        String color = approved ? "#22c55e" : "#ef4444";
        String icon = approved ? "✅" : "❌";

        String adminNoteRow = (booking.getAdminNote() != null && !booking.getAdminNote().isBlank())
                ? "<tr><td style=\"padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;\">Admin Note</td>"
                  + "<td style=\"padding:8px 12px;color:#ef4444;\">" + booking.getAdminNote() + "</td></tr>"
                : "";

        String html = """
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:24px;border-radius:12px;">
                  <div style="background:#001d45;padding:20px 24px;border-radius:8px;text-align:center;margin-bottom:20px;">
                    <h1 style="color:#f45e2b;margin:0;font-size:22px;letter-spacing:-0.5px;">UniSlot</h1>
                    <p style="color:rgba(255,255,255,0.5);margin:4px 0 0;font-size:11px;letter-spacing:1px;">SMART CAMPUS OPERATIONS HUB</p>
                  </div>
                  <div style="background:#ffffff;border-radius:8px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                      <span style="font-size:28px;">%s</span>
                      <h2 style="margin:0;color:%s;font-size:20px;">Booking %s</h2>
                    </div>
                    <p style="color:#374151;margin:0 0 20px;font-size:14px;">
                      Hi <strong>%s</strong>, your booking request has been <strong style="color:%s;">%s</strong>.
                    </p>
                    <table style="width:100%%;border-collapse:collapse;font-size:13px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                      <tr>
                        <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;width:38%%;">Resource Type</td>
                        <td style="padding:8px 12px;color:#1f2937;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;">Date</td>
                        <td style="padding:8px 12px;color:#1f2937;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;">Time</td>
                        <td style="padding:8px 12px;color:#1f2937;">%s – %s</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;">Purpose</td>
                        <td style="padding:8px 12px;color:#1f2937;">%s</td>
                      </tr>
                      <tr>
                        <td style="padding:8px 12px;background:#f8fafc;font-weight:600;color:#374151;">Status</td>
                        <td style="padding:8px 12px;font-weight:700;color:%s;">%s</td>
                      </tr>
                      %s
                    </table>
                    <p style="margin:20px 0 0;font-size:13px;color:#6b7280;">
                      Log in to <a href="http://localhost:5173" style="color:#f45e2b;text-decoration:none;">UniSlot</a> to view your bookings.
                    </p>
                  </div>
                  <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px;">
                    This is an automated message from UniSlot. Please do not reply.
                  </p>
                </div>
                """.formatted(
                icon, color, statusWord,
                userName, color, statusWord.toLowerCase(),
                booking.getResourceType() != null ? booking.getResourceType() : "N/A",
                booking.getDate(),
                booking.getStartTime(), booking.getEndTime(),
                booking.getPurpose() != null ? booking.getPurpose() : "N/A",
                color, statusWord,
                adminNoteRow
        );

        try {
            var mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(icon + " Your Booking has been " + statusWord + " — UniSlot");
            helper.setText(html, true);
            mailSender.send(mimeMessage);
            log.info("Booking status email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
