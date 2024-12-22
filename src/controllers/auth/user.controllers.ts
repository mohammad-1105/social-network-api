import { UserRolesEnum } from "@/constants";
import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import { User, type IUser } from "@/models/auth/user.model";
import { emailVerificationMailgenContent, sendEmail } from "@/utils/mail";
import { registerUserSchema, type RegisterUserType } from "@/schemas/auth/user.schema";



const registerUser = asyncHandler(async (req, res) => {

    // get the data from the request 
    const { username, fullName, email, password, role }: RegisterUserType = req.body;

    // validation with zod schema 
    const result = registerUserSchema.safeParse({ username, fullName, email, password, role });

    if (!result.success) {
        throw new ApiError(400, result.error.issues[0].message);
    }

    // check if the user already exists 
    const existedUser: IUser | null = await User.findOne({ email })

    if (existedUser) {
        throw new ApiError(400, "User already exists");
    }

    // create a new user 
    const newUser = await User.create({
        username: username,
        fullName: fullName,
        email: email,
        isEmailVerified: false,
        password: password,
        role: role || UserRolesEnum.USER,
    }) as IUser



    // generate a temporary token for the new user
    // the unhashed token is sent to the user's email
    // the hashed token is stored in the database
    // the tokenExpiry is the time when the token will expire
    const { hashedToken, unHashedToken, tokenExpiry } = newUser.generateTemporaryToken();

    newUser.emailVerificationToken = hashedToken;
    newUser.emailVerificationTokenExpiry = new Date(tokenExpiry)

    // save the user
    await newUser.save({ validateBeforeSave: false });

    // send email
    await sendEmail({
        email: newUser.email,
        subject: "Email Verification",
        mailgenContent: emailVerificationMailgenContent(
            newUser.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    })


    // get the created user 
    const createdUser: IUser | null = await User.findById(newUser._id).select("-password -refreshToken -forgotPasswordToken -forgotPasswordTokenExpiry -emailVerificationToken -emailVerificationTokenExpiry")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // send respose 
    return res.status(201).json(
        new ApiResponse(201, 
            "User registered successfully, Please check your email to verify", 
            { user: createdUser })
    )
})






// export controllers 
export {
    registerUser
}