import nodemailer from "nodemailer";
import { config } from "../config/config.js";

const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false,
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
  return quantities.map(q => `• ${q.toLocaleString()} units`).join("<br>");
};

  

 const html = `
<html>
<body style="
  font-family:Arial,sans-serif;
  margin:0;
  padding:0;
  background:#ffffff;
">

<table width="100%" cellpadding="20" cellspacing="0">

<tr>
<td style="
  background:#1f2937;
  color:#ffffff;
  text-align:center;
  padding:24px;
">
  <h2 style="margin:0;font-size:22px;">New RFP Received</h2>
  <div style="margin-top:6px;font-size:13px;">
    ${formatDate(rfp.createdAt)}
  </div>
</td>
</tr>

<tr>
<td>

${sectionBlock("Contact Information", `
  ${row("Full Name", rfp.fullName)}
  ${row("Company Name", rfp.companyName)}
  ${row("Email", rfp.email)}
  ${row("Phone", rfp.phone)}
  ${row("Location", `${rfp.city}, ${rfp.stateProvince}, ${rfp.country}`)}
`)}

${sectionBlock("Book Details", `
  ${row("Book Title", rfp.bookTitle)}
  ${row("Category", rfp.bookCategory)}
  ${row("Trim Size", rfp.trimSize)}
  ${row("Orientation", rfp.orientation)}
`)}

${sectionBlock("Binding & Cover", `
  ${row("Binding Type", rfp.bindingType)}
  ${row("Cover Stock", rfp.coverStock)}
  ${row("Cover Ink", rfp.coverInk)}
  ${row("Cover Lamination", rfp.coverLamination)}
`)}

${sectionBlock("Text & Paper", `
  ${row("Total Pages", rfp.totalPages)}
  ${row("Text Ink", rfp.textInk)}
  ${row("Paper Stock", rfp.textPaperStock)}
`)}

${sectionBlock("Quantities & Shipping", `
  ${row("Quantities", formatQuantities(rfp.quantities))}
  ${row("Shipping Method", rfp.shippingMethod)}
  ${row("Delivery Address", `${rfp.deliveryAddress}, ${rfp.deliveryCity}`)}
`)}

${sectionBlock("Additional Information", `
  ${row("How Did You Hear About Us?", rfp.howDidYouHear)}
  ${row("Special Instructions", rfp.specialInstructions)}
`)}

</td>
</tr>

<tr>
<td style="
  text-align:center;
  font-size:12px;
  color:#6b7280;
  padding:16px;
">
  RFP ID: ${rfp._id}
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
    subject: `New RFP from ${rfp?.fullName} - ${rfp?.bookTitle}`,
    html,
  });
};