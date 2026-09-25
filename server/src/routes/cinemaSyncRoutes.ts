import express from "express";

import {
  syncCinema
} from "../controllers/cinemaSyncController";

const router = express.Router();

router.post("/sync", syncCinema);

export default router;
