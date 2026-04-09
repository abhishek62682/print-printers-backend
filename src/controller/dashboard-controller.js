import createHttpError from "http-errors";
import Blog from "../model/blog-model.js";
import Enquiry from "../model/rfp-model.js";
import Testimonial from "../model/testimonial-model.js";

export const getStats = async (req, res, next) => {
  try {
    const [
      totalBlogs,
      activeBlogs,
      inactiveBlogs,

      totalEnquiries,
      newRFPEnquiries,
      inProductionEnquiries,
      inQCEnquiries,
      shippedEnquiries,

      totalTestimonials,
      activeTestimonials,
      inactiveTestimonials,

      recentEnquiries,
      recentBlogs,
    ] = await Promise.all([
      Blog.countDocuments(),
      Blog.countDocuments({ isActive: true }),
      Blog.countDocuments({ isActive: false }),

      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: "New RFP" }),
      Enquiry.countDocuments({ status: "In Production" }),
      Enquiry.countDocuments({ status: "In QC" }),
      Enquiry.countDocuments({ status: "Shipped & Completed" }),

      Testimonial.countDocuments(),
      Testimonial.countDocuments({ isActive: true }),
      Testimonial.countDocuments({ isActive: false }),

      Enquiry.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Blog.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title coverImage isActive createdAt tags")
        .populate("createdBy", "username")
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      message: "Stats fetched successfully.",
      data: {
        blogs:        { total: totalBlogs,        active: activeBlogs,        inactive: inactiveBlogs },
        enquiries:    {
          total:               totalEnquiries,
          newRFP:              newRFPEnquiries,
          inProduction:        inProductionEnquiries,
          inQC:                inQCEnquiries,
          shippedAndCompleted: shippedEnquiries,
        },
        testimonials: { total: totalTestimonials, active: activeTestimonials, inactive: inactiveTestimonials },
        recentEnquiries,
        recentBlogs,
      },
    });
  } catch (error) {
    next(createHttpError(500, error?.message ?? "Failed to fetch stats."));
  }
};