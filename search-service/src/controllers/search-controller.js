const Search = require("../models/Search");
const logger = require("../utils/logger");

const searchPostController = async (req, res) => {
  logger.info("Starting search post controller");
  try {
    const { query } = req.query;
    const results = await Search.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);
    res.json(results);
  } catch (e) {
    logger.error(e, "Error occured while searching post");
    res
      .status(500)
      .json({ success: false, message: "Error while searching post " });
  }
};

module.exports = { searchPostController };
