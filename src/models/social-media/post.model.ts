import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IPost extends Document {
  content: string;
  images: {
    url: string;
    publicId: string | null; 
  }[];
  tags: string[];
  postAuthor: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const postSchema: Schema<IPost> = new Schema<IPost>(
  {
    content: {
      type: String,
      required: [true, "Content for the post is required"],
      minlength: [10, "Content must be at least 10 characters long"],
      maxlength: [100, "Content must be at most 100 characters long"],
      index: true,
    },

    images: {
      type: [
        {
          url: {
            type: String, // Public URL of the image
            required: [true, "Image URL is required"],
            validate: {
              validator: (url: string) =>
                /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/.test(url),
              message: "Image URL must be valid and point to an image file.",
            },
          },
          publicId: {
            type: String,
            default: null,
          },
        },
      ],
      validate: {
        validator: (images: { url: string; publicId: string | null }[]) =>
          images.length <= 4,
        message: "You can upload a maximum of 4 images.",
      },
      default: [],
    },

    tags: {
      type: [String],
      validate: {
        validator: (tags: string[]) =>
          tags.length <= 10 &&
          tags.every((tag) => /^[a-zA-Z0-9_-]{1,20}$/.test(tag)),
        message:
          "Each tag must be alphanumeric, up to 20 characters long, and a maximum of 10 tags is allowed.",
      },
      default: [],
    },

    postAuthor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post author is required"],
    },
  },
  { timestamps: true }
);

/**
 * Adds pagination functionality to the Post schema
 */
postSchema.plugin(mongooseAggregatePaginate);

export const Post = mongoose.model<IPost>("Post", postSchema);
