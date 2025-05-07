const { commentSchema } = require("../models/comment");

async function add_comment(req, res) {
  const body = req.body;
  try {
    const comment = new commentSchema({
      shopID: body?.shop_id,
      comment: body?.comment,
      name: body?.name,
      phone: body?.phone,
      rating: body?.rating,
    });
    await comment.save();
    return res.status(200).json({ msg: "Comment added Successfully" });
  } catch (error) {
    return res.status(400).json({ msg: error.message });
  }
}

async function get_shop_comment(req, res) {
  const { shop_id, page = 1, limit = 15 } = req.query;

  try {
    const comments = await commentSchema
      .find({ shopID: shop_id })
      .select({ comment: 1, rating: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    if (!comments || comments.length === 0) {
      return res.status(200).json({ msg: "No comments found" });
    }

    const totalComments = await commentSchema.countDocuments({ shopID: shop_id });
    const totalPages = Math.ceil(totalComments / limit);

    return res.status(200).json({
      msg: "Comments",
      target: comments,
      pageInfo: {
        totalItems: totalComments,
        totalPages,
        currentPage: parseInt(page) || 1,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ msg: "Internal Server Error" });
  }
}

module.exports = {
  add_comment,
  get_shop_comment,
};
