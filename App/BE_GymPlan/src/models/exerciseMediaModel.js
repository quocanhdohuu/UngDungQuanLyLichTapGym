const db = require("../config/db");

const exerciseExists = async (exerciseId) => {
  const [rows] = await db
    .promise()
    .query("SELECT exerciseId FROM `exercises` WHERE exerciseId = ? LIMIT 1", [
      exerciseId,
    ]);

  return rows.length > 0;
};

const insertMedia = async ({
  exerciseId,
  mediaUrl,
  publicId,
  mediaType,
  sortOrder,
}) => {
  const [result] = await db
    .promise()
    .query(
      "INSERT INTO `exercisemedia` (exerciseId, mediaUrl, publicId, mediaType, sortOrder) VALUES (?, ?, ?, ?, ?)",
      [exerciseId, mediaUrl, publicId, mediaType, sortOrder],
    );

  return {
    mediaId: result.insertId,
    exerciseId,
    mediaUrl,
    publicId,
    mediaType,
    sortOrder,
  };
};

module.exports = {
  exerciseExists,
  insertMedia,
};
