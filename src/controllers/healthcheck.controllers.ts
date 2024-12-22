import { asyncHandler } from "@/utils/asyncHandler";
import { ApiResponse } from "@/utils/ApiResponse";

export const healthCheck = asyncHandler(async (_req, res) => {

    return res.status(200).json(
        new ApiResponse(200, "Service is up and running man", null)
    );

})