import express from "express";

import {
  getScreens,
  getScreenById,
  createScreen,
  updateScreen,
  deleteScreen
} from "../controllers/theaterScreenController";

const router = express.Router();

router.get("/", getScreens);

router.get("/:id", getScreenById);

router.post("/", createScreen);

router.put("/:id", updateScreen);

router.delete("/:id", deleteScreen);

export default router;
