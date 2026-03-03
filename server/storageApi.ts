import { Router } from "express";
import { storagePut } from "./storage";

const router = Router();

router.post("/upload", async (req, res) => {
  try {
    const { key, data, contentType } = req.body;

    if (!key || !data || !contentType) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(data, "base64");

    // Upload to S3
    const result = await storagePut(key, buffer, contentType);

    res.json(result);
  } catch (error: any) {
    console.error("Storage upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
