import express from "express";
import auth from "../middlewares/auth.js";
import admin from "../middlewares/admin.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", auth, admin, adminController.listUsers);

router.post("/users", auth, admin, adminController.createUser);

router.put("/users/:id", auth, admin, adminController.updatePermissions);

router.delete("/users/:id", auth, admin, adminController.deleteUser);

export default router;