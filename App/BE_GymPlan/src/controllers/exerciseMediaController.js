const { uploadMedia } = require("../services/cloudinaryService");
const { exerciseExists, insertMedia } = require("../models/exerciseMediaModel");

const uploadExerciseMedia = async (req, res) => {
  const { exerciseId } = req.params;

  try {
    if (!(await exerciseExists(exerciseId))) {
      return res.status(404).json({
        success: false,
        message: "Exercise không tồn tại",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn ảnh hoặc video",
      });
    }

    const mediaType = req.file.mimetype.startsWith("image/")
      ? "IMAGE"
      : "VIDEO";
    const sortOrder =
      req.body.sortOrder === undefined ? 0 : Number(req.body.sortOrder);

    if (!Number.isInteger(sortOrder)) {
      return res.status(400).json({
        success: false,
        message: "sortOrder phải là số nguyên",
      });
    }

    const uploadResult = await uploadMedia(req.file.buffer, req.file.mimetype);
    const data = await insertMedia({
      exerciseId: Number(exerciseId),
      mediaUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      mediaType,
      sortOrder,
    });

    return res.status(201).json({
      success: true,
      message: "Upload media thành công",
      data,
    });
  } catch (error) {
    console.error("Upload exercise media error:", error);
    return res.status(500).json({
      success: false,
      message: "Upload media thất bại",
    });
  }
};

module.exports = {
  uploadExerciseMedia,
};
