import express from "express";
import { proxyPDF, downloadPDF } from "../controllers/pdfController.js";

const router = express.Router();

router.get("/view", proxyPDF);
router.get("/download", downloadPDF);

export default router;
