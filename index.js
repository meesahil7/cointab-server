const express = require("express");
const app = express();
const cors = require("cors");
const { authenticate } = require("./Middlewares/auth.middleware");
const { userRouter } = require("./Routes/user.route");
const { connection } = require("./Config/db");
require("dotenv").config();

app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

app.use(userRouter);
app.use(authenticate);
app.get("/home", (req, res) => {
  return res.status(200).send({ message: "Welcome to user details page" });
});

app.listen(process.env.PORT, async () => {
  try {
    await connection;
    console.log("Connected to the database");
  } catch (err) {
    console.log("Cannot connect to the database");
    console.log(err);
  }
  console.log(`The server is listening on port ${process.env.PORT}...`);
});
