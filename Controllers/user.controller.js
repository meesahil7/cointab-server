const { userModel } = require("../Models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (await userModel.findOne({ email })) {
      return res.send({ message: "User already exists" });
    }
    bcrypt.hash(password, 7, async (err, hash) => {
      if (err) {
        console.log(err);
      } else {
        const newUser = new userModel({
          name,
          email,
          password: hash,
        });
        await newUser.save();
        res.send({ message: "User registered" });
      }
    });
  } catch (err) {
    console.log(err);
    res.send({ err: "Cannot register user" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.send({ err: "User is not registered" });
    }

    if (user.lock_until !== null && Date.now() > user.lock_until) {
      await userModel.findByIdAndUpdate(
        { _id: user._id },
        { $set: { suspect: false, lock_until: null } }
      );
    }

    const attempt = user.login_error + 1;
    if (attempt >= 5) {
      if (attempt === 5) {
        const unlock = Date.now() + 24 * 3600 * 1000;
        await userModel.findByIdAndUpdate(
          { _id: user._id },
          { $set: { lock_until: unlock, suspect: true } }
        );
      }
      await userModel.findByIdAndUpdate(
        { _id: user._id },
        { $set: { login_error: attempt } }
      );
      return res.send({
        warning: "Maximum attempt limit exceeded",
        err: "Try after 24 hours from your last wrong attempt",
      });
    }

    const hash = user.password;
    bcrypt.compare(password, hash, async (err, result) => {
      if (result && !user.suspect) {
        const token = jwt.sign({ user_id: user._id }, process.env.KEY);
        await userModel.findByIdAndUpdate(
          { _id: user._id },
          { $set: { lock_until: null, suspect: false, login_error: 0 } }
        );
        return res.send({ message: "Logged in successfully", Token: token });
      } else {
        const attempt = user.login_error + 1;
        await userModel.findByIdAndUpdate(
          { _id: user._id },
          { $set: { login_error: attempt } }
        );

        return res.send({
          err: "Wrong password",
          total_attempts: user.login_error + 1,
          attempts_remaining: 5 - user.login_error - 1,
        });
      }
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
    res.send({ err: "Wrong credentials" });
  }
};

module.exports = { register, login };
