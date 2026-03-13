import createHttpError from "http-errors";
import Blog from "../model/blog-model.js";
import Enquiry from "../model/enquiry-model.js";
import Testimonial from "../model/testimonial-model.js";

export const getStats = async (req, res, next) => {
  try {
    const [
      totalBlogs,
      activeBlogs,
      inactiveBlogs,

      totalEnquiries,
      newEnquiries,
      contactedEnquiries,
      quotedEnquiries,
      convertedEnquiries,
      closedEnquiries,

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
      Enquiry.countDocuments({ status: "new" }),
      Enquiry.countDocuments({ status: "contacted" }),
      Enquiry.countDocuments({ status: "quoted" }),
      Enquiry.countDocuments({ status: "converted" }),
      Enquiry.countDocuments({ status: "closed" }),

      Testimonial.countDocuments(),
      Testimonial.countDocuments({ isActive: true }),
      Testimonial.countDocuments({ isActive: false }),

      Enquiry.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullName companyName email status productType createdAt")
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
        enquiries:    { total: totalEnquiries,    new: newEnquiries,          contacted: contactedEnquiries, quoted: quotedEnquiries, converted: convertedEnquiries, closed: closedEnquiries },
        testimonials: { total: totalTestimonials, active: activeTestimonials, inactive: inactiveTestimonials },
        recentEnquiries,
        recentBlogs,
      },
    });
  } catch (error) {
    next(createHttpError(500, error?.message ?? "Failed to fetch stats."));
  }
};