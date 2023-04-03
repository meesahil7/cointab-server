const express = require("express");
const { register, login } = require("../Controllers/user.controller");
const app = express();

const userRouter = express.Router();

userRouter.post("/register", register);
userRouter.post("/login", login);

module.exports = { userRouter };
