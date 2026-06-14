const { z } = require("zod");

const createCommentSchema = z.object({
  body: z.string().min(1, "Comment body cannot be empty.").max(2000, "Comment is too long."),
});

module.exports = {
  createCommentSchema,
};
