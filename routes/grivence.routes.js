


import { getRequest, myRequests, sendRequest } from "../controllers/grivence.controller.js";
import { Router } from "express";

const router = Router();

// These paths will follow /api/v1/grivence
router.post("/sendRequest", sendRequest);
router.get("/getRequest", getRequest);
router.get("/myRequests", myRequests);

export default router;