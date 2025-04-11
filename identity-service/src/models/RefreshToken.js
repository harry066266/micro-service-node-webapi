const moongoose = require("mongoose");

const refreshTokenSchema = new moongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    user: {
      type: moongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = moongoose.model("RefreshToken", refreshTokenSchema);

module.exports = RefreshToken;
