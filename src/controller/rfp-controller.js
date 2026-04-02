import RFP from "../model/rfp-model.js";
import createHttpError from "http-errors";
import { sendContactNotificationEmail } from "../utils/send-email.js";

export const createRFP = async (req, res, next) => {
  try {
    const { recaptchaToken, ...rfpData } = req.body;

    // ✅ Google reCAPTCHA v2 verification
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return res.status(400).json({ success: false, message: 'Security verification failed. Please try again.' });
    }

    const rfp = await RFP.create(rfpData);

    sendContactNotificationEmail(rfp).catch((err) => {
      console.error("RFP notification email failed:", err);
    });

    return res.status(201).json({
      success: true,
      message: "RFP submitted successfully. We'll get back to you soon!",
      data: rfp,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRFPs = async (req, res, next) => {
  try {
    const { country, status, page, limit, startDate, endDate } = req.query;

    const filter = {};
    if (country) filter.country = { $regex: country, $options: "i" };
    if (status)  filter.status  = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate)   filter.createdAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [rfps, total] = await Promise.all([
      RFP.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RFP.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: "RFPs fetched successfully.",
      data: rfps,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── Export all matching RFPs — no pagination limit ────────────────────────
export const exportRFPs = async (req, res, next) => {
  try {
    const { country, status, startDate, endDate } = req.query;

    const filter = {};
    if (country) filter.country = { $regex: country, $options: "i" };
    if (status)  filter.status  = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate)   filter.createdAt.$lte = endDate;
    }

    const rfps = await RFP.find(filter).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      message: "RFPs exported successfully.",
      data: rfps,
    });
  } catch (error) {
    next(error);
  }
};

export const getRFPById = async (req, res, next) => {
  try {
    const rfp = await RFP.findById(req.params.id);

    if (!rfp) {
      return next(createHttpError(404, "RFP not found"));
    }

    return res.status(200).json({
      success: true,
      message: "RFP fetched successfully.",
      data: rfp,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update status + notes only ───────────────────────────────────────────
export const updateRFP = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const rfp = await RFP.findByIdAndUpdate(
      req.params.id,
      { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
      { new: true, runValidators: true }
    );

    if (!rfp) {
      return next(createHttpError(404, "RFP not found"));
    }

    return res.status(200).json({
      success: true,
      message: "RFP updated successfully.",
      data: rfp,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRFP = async (req, res, next) => {
  try {
    const rfp = await RFP.findByIdAndDelete(req.params.id);

    if (!rfp) {
      return next(createHttpError(404, "RFP not found"));
    }

    return res.status(200).json({
      success: true,
      message: "RFP deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};