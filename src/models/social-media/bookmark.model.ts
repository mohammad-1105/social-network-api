import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IBookmark extends Document {
  postId: Schema.Types.ObjectId;
  bookmarkedBy: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const bookmarkSchema: Schema<IBookmark> = new Schema<IBookmark>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post ID is required"],
    },
    bookmarkedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
  },
  { timestamps: true }
);

// Add paginate plugin
bookmarkSchema.plugin(mongooseAggregatePaginate);

export const Bookmark = mongoose.model<IBookmark>("Bookmark", bookmarkSchema);
