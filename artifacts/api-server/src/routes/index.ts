import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import productsRouter from "./products";
import ordersRouter from "./orders";
import adminRouter from "./admin";
import settingsRouter from "./settings";
import accountRouter from "./account";
import reviewsRouter from "./reviews";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(productsRouter);
router.use(ordersRouter);
router.use(adminRouter);
router.use(settingsRouter);
router.use(accountRouter);
router.use(reviewsRouter);

export default router;
