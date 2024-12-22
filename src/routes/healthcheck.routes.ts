import Router from "express";
import { healthCheck } from "@/controllers/healthcheck.controllers";

const healthCheckRouter = Router()

healthCheckRouter.route("/").get(healthCheck)

export { healthCheckRouter }