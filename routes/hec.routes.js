import {Router} from "express";
import { getAllMessages, sendMessage } from "../controllers/hec.controller.js";



const router = Router();

router.post("/sendMessage",sendMessage);
router.get("/getAllMessages",getAllMessages);


export default router;