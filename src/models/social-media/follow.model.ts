import mongoose, { Schema, Document } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

export interface IFollow extends Document {
  followerId: Schema.Types.ObjectId;
  followeeId: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const followSchema: Schema<IFollow> = new Schema<IFollow>(
  {
    // The one who follows
    followerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    // The one who is being followed
    followeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Add paginate plugin
followSchema.plugin(mongooseAggregatePaginate);

export const Follow = mongoose.model<IFollow>("Follow", followSchema);
