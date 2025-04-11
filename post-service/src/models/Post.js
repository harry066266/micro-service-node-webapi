const moongoose = require("mongoose");
const {
  modelName,
} = require("../../../identity-service/src/models/RefreshToken");

const postSchema = new moongoose.Schema(
  {
    user: {
      type: moongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
    mediaIds: [
      {
        type: String,
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

postSchema.index({ content: "text" });

const Post = moongoose.model("Post", postSchema);

module.exports = Post;
