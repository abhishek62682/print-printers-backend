import Enquiry from "../model/enquiry-model.js";
import createHttpError from "http-errors";

export const createEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.create(req.body);

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
    // page and limit are already Numbers — transformed by zod
    const { productType, country, status, page, limit } = req.query;

    const filter = {};
    if (productType) filter.productType = productType;
    if (country)     filter.country = { $regex: country, $options: "i" };
    if (status)      filter.status = status;

    const skip = (page - 1) * limit;

    const [enquiries, total] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Enquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Enquiries fetched successfully.",
      data: enquiries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
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