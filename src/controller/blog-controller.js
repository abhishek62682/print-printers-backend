import createHttpError from "http-errors";
import fs from "fs";
import Blog from "../model/blog-model.js";
import logActivity from "../utils/log-activity.js";

const deleteImageFromDisk = (imagePath) => {
  if (!imagePath) return;
  fs.unlink(imagePath, (err) => {
    if (err) console.error(`[IMAGE DELETE ERROR]: ${err.message}`);
  });
};

// ✅ Helper to safely parse JSON strings
const parseJSON = (str, defaultValue = null) => {
  if (!str) return defaultValue;
  try {
    return typeof str === "string" ? JSON.parse(str) : str;
  } catch {
    return defaultValue;
  }
};

const createBlog = async (req, res, next) => {
  try {
    const { 
      title, 
      content, 
      excerpt,
      tags, 
      coverImageAlt,
      bannerImageAlt,
      seo,
      isActive 
    } = req.body;

    const coverImage  = req.files?.coverImage?.[0]?.path  ?? null;
    const bannerImage = req.files?.bannerImage?.[0]?.path ?? null;

    const blogData = {
      title,
      content,
      excerpt: excerpt || null,
      coverImage,
      coverImageAlt: coverImageAlt || "",
      bannerImage,
      bannerImageAlt: bannerImageAlt || "",
      tags: parseJSON(tags, []),
      createdBy: req.user._id,
      isActive: isActive === "true" || isActive === true,
    };

    // ✅ Parse SEO properly
    if (seo) {
      const parsedSeo = parseJSON(seo, {});
      blogData.seo = {
        metaTitle: parsedSeo.metaTitle || "",
        metaDescription: parsedSeo.metaDescription || "",
        metaKeywords: Array.isArray(parsedSeo.metaKeywords) ? parsedSeo.metaKeywords : [],
        canonicalUrl: parsedSeo.canonicalUrl || "",
      };
    }

    const blog = await Blog.create(blogData);
    await blog.populate("createdBy", "username email");

    await logActivity({
      userId: req.user._id,
      action: "CREATE",
      module: "BLOG",
      targetId: blog._id,
      targetLabel: blog.title,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      data: blog,
    });
  } catch (err) {
    await logActivity({
      userId: req.user._id,
      action: "CREATE",
      module: "BLOG",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
};

const getAllBlogs = async (req, res, next) => {
  try {
    const page  = req.query.page  ?? 1;
    const limit = req.query.limit ?? 10;
    const skip  = (page - 1) * limit;

    const filter = {};

    if (req.query.status === "active") {
      filter.isActive = true;
    } else if (req.query.status === "inactive") {
      filter.isActive = false;
    }

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.search) {
      filter.$or = [
        { title:   { $regex: req.query.search, $options: "i" } },
        { content: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [blogs, total] = await Promise.all([
      Blog.find(filter)
        .populate("createdBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blog.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully.",
      data: blogs,
      pagination: {
        total,
        page,
        limit,
        totalPages:  Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getPublicBlogs = async (req, res, next) => {
  try {
    const filter = { isActive: true };

    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    if (req.query.search) {
      filter.$or = [
        { title:   { $regex: req.query.search, $options: "i" } },
        { content: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const blogs = await Blog.find(filter)
      .populate("createdBy", "username email")
      .sort({ createdAt: -1 })
      .select("title slug coverImage coverImageAlt excerpt tags createdAt createdBy");

    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully.",
      data: blogs,
    });
  } catch (err) {
    next(err);
  }
};

const getBlogById = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy", "username email");
    if (!blog) return next(createHttpError(404, "Blog not found."));

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully.",
      data: blog,
    });
  } catch (err) {
    next(err);
  }
};

const getBlogBySlug = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({
      slug:     req.params.slug,
      isActive: true,
    }).populate("createdBy", "username email");

    if (!blog) return next(createHttpError(404, "Blog not found."));

    const recentBlogs = await Blog.find({
      _id:      { $ne: blog._id },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title slug coverImage coverImageAlt excerpt createdAt");

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully.",
      data: blog,
      recentBlogs,
    });
  } catch (err) {
    next(err);
  }
};

const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { 
      title, 
      content, 
      excerpt,
      tags, 
      coverImageAlt,
      bannerImageAlt,
      seo,
      isActive 
    } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return next(createHttpError(404, "Blog not found."));

    const coverImage  = req.files?.coverImage?.[0]?.path  ?? undefined;
    const bannerImage = req.files?.bannerImage?.[0]?.path ?? undefined;

    if (coverImage  && blog.coverImage)  deleteImageFromDisk(blog.coverImage);
    if (bannerImage && blog.bannerImage) deleteImageFromDisk(blog.bannerImage);

    const updatedData = {
      ...(title    !== undefined && { title }),
      ...(content  !== undefined && { content }),
      ...(excerpt  !== undefined && { excerpt }),
      ...(tags     !== undefined && { tags: parseJSON(tags, blog.tags) }),
      ...(coverImageAlt !== undefined && { coverImageAlt }),
      ...(bannerImageAlt !== undefined && { bannerImageAlt }),
      ...(isActive !== undefined && { isActive: isActive === "true" || isActive === true }),
      ...(coverImage  && { coverImage }),
      ...(bannerImage && { bannerImage }),
    };

    // ✅ Parse SEO properly on update
    if (seo !== undefined) {
      const parsedSeo = parseJSON(seo, {});
      updatedData.seo = {
        metaTitle: parsedSeo.metaTitle || blog.seo?.metaTitle || "",
        metaDescription: parsedSeo.metaDescription || blog.seo?.metaDescription || "",
        metaKeywords: Array.isArray(parsedSeo.metaKeywords) 
          ? parsedSeo.metaKeywords 
          : blog.seo?.metaKeywords || [],
        canonicalUrl: parsedSeo.canonicalUrl || blog.seo?.canonicalUrl || "",
      };
    }

    const updated = await Blog.findByIdAndUpdate(id, updatedData, {
      returnDocument: 'after',
      runValidators: true,
    }).populate("createdBy", "username email");

    await logActivity({
      userId: req.user._id,
      action: "UPDATE",
      module: "BLOG",
      targetId: updated._id,
      targetLabel: updated.title,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully.",
      data: updated,
    });
  } catch (err) {
    await logActivity({
      userId: req.user._id,
      action: "UPDATE",
      module: "BLOG",
      targetId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
};

const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return next(createHttpError(404, "Blog not found."));

    deleteImageFromDisk(blog.coverImage);
    deleteImageFromDisk(blog.bannerImage);

    await logActivity({
      userId: req.user._id,
      action: "DELETE",
      module: "BLOG",
      targetId: req.params.id,
      targetLabel: blog.title,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "SUCCESS",
    });

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully.",
      data: null,
    });
  } catch (err) {
    await logActivity({
      userId: req.user._id,
      action: "DELETE",
      module: "BLOG",
      targetId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      status: "FAILED",
    });
    next(err);
  }
};

export { createBlog, getAllBlogs, getBlogById, getBlogBySlug, getPublicBlogs, updateBlog, deleteBlog };