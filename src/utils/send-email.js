import  nodemailer from "nodemailer";
import  {config}  from "../config/config.js";



const transporter = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: false, // 587 => false
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});


export const sendContactNotificationEmail = async (enquiry) => {
  await transporter.sendMail({
    from: `"Print Printers Website" <${config.smtpUser}>`,
    to: config.contactNotifyEmail,
    replyTo: enquiry?.email,
    subject: `New Enquiry from ${enquiry?.fullName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
        <h2>New Enquiry Received</h2>

        <p><strong>Full Name:</strong> ${enquiry?.fullName}</p>
        <p><strong>Company Name:</strong> ${enquiry?.companyName}</p>
        <p><strong>Email:</strong> ${enquiry?.email}</p>
        <p><strong>Phone Number:</strong> ${enquiry?.phoneNumber}</p>
        <p><strong>Country:</strong> ${enquiry?.country}</p>

        <hr />

        <p><strong>Product Type:</strong> ${enquiry.productType}</p>
        <p><strong>Binding Type:</strong> ${enquiry.bindingType}</p>
        <p><strong>Approximate Quantity:</strong> ${enquiry.approximateQuantity}</p>
        <p><strong>Required Delivery Date:</strong> ${
          enquiry.requiredDeliveryDate
            ? new Date(enquiry.requiredDeliveryDate).toLocaleDateString("en-IN")
            : "N/A"
        }</p>
        <p><strong>Specialty Finishing:</strong> ${enquiry.specialtyFinishing}</p>

        <p><strong>Project Description:</strong></p>
        <p>${enquiry.projectDescription || "N/A"}</p>

        <p><strong>How Did You Hear About Us:</strong> ${enquiry.howDidYouHear || "N/A"}</p>

        <hr />

        <p><strong>Status:</strong> ${enquiry.status || "new"}</p>
        <p><strong>Notes:</strong> ${enquiry.notes || "N/A"}</p>
      </div>
    `,
  });
};

