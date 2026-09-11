import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth.js";
import employerJobsRouter from "./employer-jobs.js";
import publicJobsRouter from "./public-jobs.js";
import storageRouter from "./storage.js";
import adminJobsRouter from "./admin-jobs.js";
import recruitmentRouter from "./recruitment.js";
import recruitmentRequestsRouter from "./recruitment-requests.js";
import adminOutreachRouter from "./admin-outreach.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employerJobsRouter);
router.use(publicJobsRouter);
router.use(storageRouter);
router.use(adminJobsRouter);
router.use(recruitmentRouter);
router.use(recruitmentRequestsRouter);
router.use(adminOutreachRouter);

export default router;
