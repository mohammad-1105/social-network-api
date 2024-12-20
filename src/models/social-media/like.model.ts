import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
  postId: Schema.Types.ObjectId;
  commentId: Schema.Types.ObjectId;
  likedBy: Schema.Types.ObjectId; // User ID
  createdAt?: Date;
  updatedAt?: Date;
}

const likeSchema: Schema<ILike> = new Schema<ILike>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Post",
      default: null,
    },

    commentId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: "Comment",
      default: null,
    },

    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model<ILike>("Like", likeSchema);
