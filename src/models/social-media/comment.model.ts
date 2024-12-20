import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
export interface IComment extends Document {
  content: string;
  postId: Schema.Types.ObjectId;
  commentAuthor: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const commentSchema: Schema<IComment> = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, "Content for the comment is required"],
      minlength: [10, "Content must be at least 10 characters long"],
      maxlength: [100, "Content must be at most 100 characters long"],
      index: true,
    },

    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post ID is required"],
    },

    commentAuthor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  { timestamps: true }
);

// Add Pagination plugin
commentSchema.plugin(mongooseAggregatePaginate);
export const Comment = mongoose.model<IComment>("Comment", commentSchema);
