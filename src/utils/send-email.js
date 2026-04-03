import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: Number(config.smtpPort) === 465,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export const sendContactNotificationEmail = async (rfp) => {
  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sectionBlock = (title, content) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="
      margin-bottom:18px;
      background:#f9fafb;
      border:1px solid #e5e7eb;
      border-radius:6px;
    ">
      <tr>
        <td style="
          padding:16px;
          font-size:15px;
          font-weight:700;
          color:#111827;
          border-bottom:1px solid #e5e7eb;
          background:#f3f4f6;
          border-radius:6px 6px 0 0;
        ">
          ${title}
        </td>
      </tr>
      <tr>
        <td style="padding:16px;">
          ${content}
        </td>
      </tr>
    </table>
  `;

  const row = (label, value) => `
    <div style="margin-bottom:12px;">
      <div style="
        font-size:12px;
        color:#6b7280;
        font-weight:600;
        margin-bottom:4px;
        text-transform:uppercase;
        letter-spacing:0.5px;
      ">
        ${label}
      </div>
      <div style="
        font-size:14px;
        color:#111827;
        line-height:1.5;
      ">
        ${value || "—"}
      </div>
    </div>
  `;

  const formatQuantities = (quantities) => {
    if (!quantities?.length) return "—";
    return quantities.map((q) => `• ${q.toLocaleString()} units`).join("<br>");
  };

  const statusBadge = (status) => {
    const colors = {
      new: "#10b981",
      contacted: "#3b82f6",
      quoted: "#f59e0b",
      converted: "#8b5cf6",
      closed: "#6b7280",
    };
    const color = colors[status] || "#6b7280";
    return `<span style="
      background:${color};
      color:#fff;
      padding:3px 10px;
      border-radius:12px;
      font-size:12px;
      font-weight:600;
    ">${status?.toUpperCase() || "NEW"}</span>`;
  };

  const html = `
<html>
<body style="
  font-family:Arial,sans-serif;
  margin:0;
  padding:0;
  background:#f3f4f6;
">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:0 auto;">

  <!-- Header -->
  <tr>
    <td style="
      background:#1f2937;
      color:#ffffff;
      text-align:center;
      padding:28px 24px;
    ">
      <h2 style="margin:0;font-size:24px;font-weight:700;">📋 New RFP Received</h2>
      <div style="margin-top:8px;font-size:13px;color:#9ca3af;">
        Submitted on ${formatDate(rfp.createdAt)}
      </div>
      <div style="margin-top:10px;">
        ${statusBadge(rfp.status)}
      </div>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="padding:24px 16px;">

      <!-- 1. Contact Information -->
      ${sectionBlock("👤 Contact Information", `
        ${row("Full Name", rfp.fullName)}
        ${row("Company Name", rfp.companyName)}
        ${row("Email", rfp.email)}
        ${row("Phone", rfp.phone)}
        ${row("Country", rfp.country)}
        ${row("State / Province", rfp.stateProvince)}
        ${row("City", rfp.city)}
        ${row("Zip Code", rfp.zipCode)}
      `)}

      <!-- 2. Book Details -->
      ${sectionBlock("📚 Book Details", `
        ${row("Book Title", rfp.bookTitle)}
        ${row("Book Category", rfp.bookCategory)}
        ${row("Trim Size", rfp.trimSize)}
        ${row("Orientation", rfp.orientation)}
        ${row("Proof Type", rfp.proofType)}
        ${row("Total Pages", rfp.totalPages)}
      `)}

      <!-- 3. Binding -->
      ${sectionBlock("🔗 Binding", `
        ${row("Binding Type", rfp.bindingType)}
        ${row("Binding Notes", rfp.bindingNotes)}
      `)}

      <!-- 4. Cover Specifications -->
      ${sectionBlock("🎨 Cover Specifications", `
        ${row("Cover Stock", rfp.coverStock)}
        ${row("Cover Ink", rfp.coverInk)}
        ${row("Cover Lamination", rfp.coverLamination)}
        ${row("Board Calliper", rfp.boardCalliper)}
        ${row("Specialty Finishes", rfp.specialtyFinishes)}
      `)}

      <!-- 5. Dust Jacket -->
      ${sectionBlock("🧥 Dust Jacket", `
        ${row("Dust Jacket Required", rfp.dustJacket)}
        ${rfp.dustJacket === "Yes" ? `
          ${row("Dust Jacket Stock", rfp.dustJacketStock)}
          ${row("Dust Jacket Ink", rfp.dustJacketInk)}
          ${row("Dust Jacket Lamination", rfp.dustJacketLamination)}
          ${row("Dust Jacket Finishes", rfp.dustJacketFinishes)}
        ` : ""}
      `)}

      <!-- 6. Endsheet -->
      ${sectionBlock("📄 Endsheet", `
        ${row("Endsheet Stock", rfp.endsheetStock)}
        ${row("Endsheet Printing", rfp.endsheetPrinting)}
      `)}

      <!-- 7. Text & Paper -->
      ${sectionBlock("📝 Text & Paper", `
        ${row("Text Paper Stock", rfp.textPaperStock)}
        ${row("Text Ink", rfp.textInk)}
      `)}

      <!-- 8. Quantities & Packing -->
      ${sectionBlock("📦 Quantities & Packing", `
        ${row("Quantities", formatQuantities(rfp.quantities))}
        ${row("Packing Method", rfp.packingMethod)}
      `)}

      <!-- 9. Shipping & Delivery -->
      ${sectionBlock("🚚 Shipping & Delivery", `
        ${row("Shipping Method", rfp.shippingMethod)}
        ${row("Delivery Address", rfp.deliveryAddress)}
        ${row("Delivery City", rfp.deliveryCity)}
        ${row("Delivery Country", rfp.deliveryCountry)}
        ${row("Delivery Zip", rfp.deliveryZip)}
      `)}

      <!-- 10. Additional Information -->
      ${sectionBlock("💬 Additional Information", `
        ${row("How Did You Hear About Us?", rfp.howDidYouHear)}
        ${row("Special Instructions", rfp.specialInstructions)}
      `)}

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="
      text-align:center;
      font-size:12px;
      color:#6b7280;
      padding:16px;
      background:#1f2937;
      color:#9ca3af;
    ">
      RFP ID: <strong style="color:#fff;">${rfp._id}</strong> &nbsp;|&nbsp;
      Submitted: ${formatDate(rfp.createdAt)}
    </td>
  </tr>

</table>
</body>
</html>
`;

  await transporter.sendMail({
    from: `"Print Printers Website" <${config.smtpUser}>`,
    to: config.contactNotifyEmail,
    replyTo: rfp?.email,
    subject: `New RFP: ${rfp?.bookTitle} — ${rfp?.fullName} (${rfp?.companyName})`,
    html,
  });
};