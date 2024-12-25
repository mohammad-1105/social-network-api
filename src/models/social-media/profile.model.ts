import mongoose, { Schema, Document } from "mongoose";

export interface IProfile extends Document {
  profileOwner: Schema.Types.ObjectId;
  coverImage: {
    url: string;
    publicId: string | null;
  };
  bio: string;
  dob: Date;
  location: string;
  website: string;
  countryCode: string;
  phoneNumber: string;
  socialLinks: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  interests: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProfileSchema: Schema<IProfile> = new Schema<IProfile>(
  {
    profileOwner: {
      type: Schema.Types.ObjectId,
      required: [true, "profileOwner is required"],
      ref: "User",
    },

    coverImage: {
      type: {
        url: String,
        publicId: String,
      },
      default: {
        url: "https://via.placeholder.com/1500x500",
        publicId: null,
      },
    },

    bio: {
      type: String,
      min: [10, "bio must be at least 10 characters long"],
      max: [100, "bio must be at most 100 characters long"],
      default: "",
    },

    dob: {
      type: Date,
      defalut: null,
    },

    location: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      match: [/^https?:\/\/.+/, "Invalid URL format"],
      default: "",
    },

    countryCode: {
      type: String,
      default: "",
    },

    phoneNumber: {
      type: String,
      default: "",
    },

    socialLinks: {
      facebook: {
        type: String,
        default: "",
      },
      twitter: {
        type: String,
        default: "",
      },
      linkedIn: {
        type: String,
        default: "",
      },
      github: {
        type: String,
        default: "",
      },

      interests: {
        type: [String],
        default: [],
      },
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>("Profile", ProfileSchema);
