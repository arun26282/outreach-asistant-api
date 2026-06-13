import * as dotenv from "dotenv";
dotenv.config();
import express, {Request, Response} from "express";
import cors from "cors";
import router from "./Routes/router";

const app : express.Application = express();


app.use(cors());
app.use(express.json());
app.use('/api', router);



app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to the Outreach Assistant API!");
});

export default app;