const cloudinary = require("../config/cloudinary");

const uploadMedia = (fileBuffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith("video/");
    const isImage = mimetype.startsWith("image/");

    if (!isImage && !isVideo) {
      return reject(new Error("Loại media không được hỗ trợ"));
    }

    const folder = isVideo
      ? "gym-app/exercises/videos"
      : "gym-app/exercises/images";

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: isVideo ? "video" : "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
      },
    );

    stream.end(fileBuffer);
  });
};

const deleteMedia = async (publicId, mediaType) => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: mediaType === "VIDEO" ? "video" : "image",
  });
};

module.exports = {
  uploadMedia,
  deleteMedia,
};
