import multer from "multer";

const storage = multer.diskStorage({
  /**
   * The destination property of multer's diskStorage object is
   * a function that takes in the request, file, and callback
   * as parameters. The callback expects two parameters, an error
   * and a path to the destination.
   *
   * The destination folder needs to exist in the root directory
   * else it will throw an error saying cannot find path.
   *
   * @param {Object} req - The express request object
   * @param {Object} file - The file sent in the request
   * @param {Function} cb - The callback function
   * @returns {void}
   */
  destination: function (
    req: object,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ): void {
    // This storage needs public/images folder in the root directory
    // Else it will throw an error saying cannot find path public/images
    cb(null, "./public/images");
  },

  // Store file in a .png/.jpeg/.jpg format instead of binary
  filename: function (
    req,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    let fileExtension: string = "";
    if (file.originalname.split(".").length > 1) {
      fileExtension = file.originalname.substring(
        file.originalname.lastIndexOf(".")
      );
    }
    const filenameWithoutExtension: string = file.originalname
      .toLowerCase()
      .split(" ")
      .join("-")
      ?.split(".")[0];
    cb(
      null,
      filenameWithoutExtension +
        Date.now() +
        Math.ceil(Math.random() * 1e5) + // avoid rare name conflict
        fileExtension
    );
  },
});

// Middleware responsible to read form data and upload the File object to the mentioned path
export const upload = multer({
  storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1 MB
  },
});
