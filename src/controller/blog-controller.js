import createHttpError from "http-errors";
import fs from "fs";
import Blog from "../model/blog-model.js";

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
const deleteImageFromDisk = (imagePath) => {
  if (!imagePath) return;
  fs.unlink(imagePath, (err) => {
    if (err) console.error(`[IMAGE DELETE ERROR]: ${err.message}`);
  });
};

// ─────────────────────────────────────────────
// POST /api/admin/blogs
// ─────────────────────────────────────────────
const createBlog = async (req, res, next) => {
  try {
    const { title, content, tags, isActive } = req.body;

    const coverImage  = req.files?.coverImage?.[0]?.path  ?? null;
    const bannerImage = req.files?.bannerImage?.[0]?.path ?? null;

    const blog = await Blog.create({
      title,
      content,
      coverImage,
      bannerImage,
      tags:      tags ? JSON.parse(tags) : [],
      createdBy: req.userId,
      isActive:  isActive || true,
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully.",
      data: blog,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/blogs  (admin — paginated, all statuses)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/blogs  (public — active only, no pagination)
// ─────────────────────────────────────────────
const getPublicBlogs = async (req, res, next) => {
  try {
    const filter = { isActive: true };  // public always sees active only

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
      .select("title slug coverImage tags createdAt createdBy"); // only needed fields

    res.status(200).json({
      success: true,
      message: "Blogs fetched successfully.",
      data: blogs,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /api/admin/blogs/:id  (admin — by ID)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// GET /api/blogs/:slug  (public — by slug)
// ─────────────────────────────────────────────
const getBlogBySlug = async (req, res, next) => {
  try {
    console.log(req.params.slug)
    const blog = await Blog.findOne({
      slug:     req.params.slug,
      isActive: true,
    }).populate("createdBy", "username email");

    if (!blog) return next(createHttpError(404, "Blog not found."));

    // Fetch 3 recent blogs excluding the current one
    const recentBlogs = await Blog.find({
      _id:      { $ne: blog._id },   // exclude current blog
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title slug coverImage createdAt");  // only needed fields

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

// ─────────────────────────────────────────────
// PATCH /api/admin/blogs/:id
// ─────────────────────────────────────────────
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isActive } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) return next(createHttpError(404, "Blog not found."));

    const coverImage  = req.files?.coverImage?.[0]?.path  ?? undefined;
    const bannerImage = req.files?.bannerImage?.[0]?.path ?? undefined;

    // Delete old images from disk if new ones uploaded
    if (coverImage  && blog.coverImage)  deleteImageFromDisk(blog.coverImage);
    if (bannerImage && blog.bannerImage) deleteImageFromDisk(blog.bannerImage);

    const updatedData = {
      ...(title    !== undefined && { title }),
      ...(content  !== undefined && { content }),
      ...(tags     !== undefined && { tags: JSON.parse(tags) }),
      ...(isActive !== undefined && { isActive: isActive === "true" }),
      ...(coverImage  && { coverImage }),
      ...(bannerImage && { bannerImage }),
    };

    const updated = await Blog.findByIdAndUpdate(id, updatedData, {
      new:          true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Blog updated successfully.",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE /api/admin/blogs/:id
// ─────────────────────────────────────────────
const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return next(createHttpError(404, "Blog not found."));

    deleteImageFromDisk(blog.coverImage);
    deleteImageFromDisk(blog.bannerImage);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully.",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

export { createBlog, getAllBlogs, getBlogById, getBlogBySlug, getPublicBlogs, updateBlog, deleteBlog };