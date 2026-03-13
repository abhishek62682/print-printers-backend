import createHttpError from "http-errors";
import Testimonial from "../model/testimonial-model.js";
import fs from "node:fs"
// POST /api/testimonials
const createTestimonial = async (req, res, next) => {
  try {
    const { name, designation, content } = req.body;

    const imageUrl = req.file ? req.file.path : null;

    const testimonial = await Testimonial.create({
      name,
      designation,
      content,
      imageUrl,
    });

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully.",
      data: testimonial,
    });
  } catch (err) {
    next(err);
  }
};
// GET /api/testimonials/public  —  no auth, no pagination, active only
const getPublicTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Testimonials fetched successfully.",
      data: testimonials,
    });
  } catch (err) {
    next(err);
  }
};
// GET /api/testimonials?page=1&limit=10&status=active
const getAllTestimonials = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    // Build filter — for inactive, also catch docs where isActive is missing/null
    const filter = {};
    if (req.query.status === 'active') {
      filter.isActive = true;
    } else if (req.query.status === 'inactive') {
      filter.$or = [{ isActive: false }, { isActive: { $exists: false } }, { isActive: null }];
    }

    const [testimonials, total] = await Promise.all([
      Testimonial.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Testimonial.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: 'Testimonials fetched successfully.',
      data: testimonials,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/testimonials/:id
// ✅ Helper to delete image from disk
const deleteImageFromDisk = (imagePath) => {
  if (!imagePath) return;
  fs.unlink(imagePath, (err) => {
    if (err) console.error(`[IMAGE DELETE ERROR]: ${err.message}`);
  });
};

// PATCH /api/testimonials/:id
const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, designation, content, isActive, removeImage } = req.body;

    const testimonial = await Testimonial.findById(id);
    if (!testimonial) {
      return next(createHttpError(404, "Testimonial not found."));
    }

    const newImageUrl = req.file ? req.file.path : undefined;

    // ✅ New image uploaded — delete old one from disk
    if (newImageUrl && testimonial.imageUrl) {
      deleteImageFromDisk(testimonial.imageUrl);
    }

    // ✅ User clicked Remove — delete old image, set imageUrl to null
    if (!newImageUrl && removeImage === "true" && testimonial.imageUrl) {
      deleteImageFromDisk(testimonial.imageUrl);
    }

    const updatedData = {
      ...(name        && { name }),
      ...(designation && { designation }),
      ...(content     && { content }),
      ...(isActive !== undefined && { isActive }),
      ...(newImageUrl            && { imageUrl: newImageUrl }),
      ...(!newImageUrl && removeImage === "true" && { imageUrl: null }),
    };

    const updated = await Testimonial.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Testimonial updated successfully.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/testimonials/:id
const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
      return next(createHttpError(404, "Testimonial not found."));
    }

    // ✅ Delete image from disk when testimonial is deleted
    deleteImageFromDisk(testimonial.imageUrl);

    res.status(200).json({
      success: true,
      message: "Testimonial deleted successfully.",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};



export { createTestimonial, getAllTestimonials, updateTestimonial, deleteTestimonial , getPublicTestimonials };