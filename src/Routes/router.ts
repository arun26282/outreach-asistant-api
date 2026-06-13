import {Router, Request, Response} from "express"
import Analyse from "../Controller/Analyse";
const router = Router();


router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK" });
});

router.post("/analyze-target", Analyse.analyse);

export default router;