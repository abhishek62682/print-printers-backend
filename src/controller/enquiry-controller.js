import Enquiry from "../model/enquiry-model.js";
import createHttpError from "http-errors";
import { sendContactNotificationEmail } from "../utils/send-email.js";

export const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.create(req.body);

    sendContactNotificationEmail(enquiry).catch((err) => {
      console.error("Enquiry notification email failed:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully. We'll get back to you soon!",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllEnquiries = async (req, res, next) => {
  try {
    // page, limit → Numbers | startDate, endDate → Date objects (transformed by Zod)
    const { productType, country, status, page, limit, startDate, endDate } = req.query;
 
    const filter = {};
    if (productType) filter.productType = productType;
    if (country)     filter.country     = { $regex: country, $options: "i" };
    if (status)      filter.status      = status;
 
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate)   filter.createdAt.$lte = endDate;
    }
 
    const skip = (page - 1) * limit;
 
    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Enquiry.countDocuments(filter),
    ]);
 
    const totalPages = Math.ceil(total / limit);
 
    return res.status(200).json({
      success: true,
      message: "Enquiries fetched successfully.",
      data: enquiries,
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
 
// ── Export all matching enquiries — no pagination limit ───────────────────
export const exportEnquiries = async (req, res, next) => {
  try {
    const { productType, country, status, startDate, endDate } = req.query;
 
    const filter = {};
    if (productType) filter.productType = productType;
    if (country)     filter.country     = { $regex: country, $options: "i" };
    if (status)      filter.status      = status;
 
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate)   filter.createdAt.$lte = endDate;
    }
 
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).lean();
 
    return res.status(200).json({
      success: true,
      message: "Enquiries exported successfully.",
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};
export const getEnquiryById = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findById(req.params.id);

    if (!enquiry) {
      return next(createHttpError(404, "Enquiry not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry fetched successfully.",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Update status + notes only ───────────────────────────────────────────
export const updateEnquiry = async (req, res, next) => {
  try {
    const { status, notes } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return next(createHttpError(404, "Enquiry not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry updated successfully.",
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);

    if (!enquiry) {
      return next(createHttpError(404, "Enquiry not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};