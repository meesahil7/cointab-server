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
    const {email, password} = req.body;
    let user = await userModel.findOne({ email });

    if (!user) {
      return res.send({ message: "User not found" });
    }

    let {login_error, lock_until, suspect} = user;

    if (lock_until >= Date.now()) {
      return res.send({ message: "Try after 24 hours from your last wrong attempt" });
    }

    if (lock_until !== null && Date.now() > lock_until) {
      await userModel.findByIdAndUpdate({_id: user._id}, {$set: {lock_until: null, login_error: 0, suspect: false}})
    }
    
    user = await userModel.findOne({ email });
    
    const hash = user.password;
    bcrypt.compare(password, hash, async (err, result) => {
      if (result) {
        const token = jwt.sign({ user_id: user._id }, process.env.KEY);
        await userModel.findByIdAndUpdate(
          { _id: user._id },
          { $set: { lock_until: null, suspect: false, login_error: 0 } }
        );
        return res.send({ message: "Logged in successfully", Token: token });
      } else {
        const wrong_attempt = user.login_error + 1;
        await userModel.findByIdAndUpdate(
          { _id: user._id },
          { $set: { login_error: wrong_attempt }}
        );

        if (wrong_attempt === 5) {
          const unlock = Date.now() + 24 * 3600 * 1000;
          await userModel.findByIdAndUpdate({_id: user._id}, {$set: {lock_until: unlock, login_error: wrong_attempt, suspect: true}});
          return res.send({ message: "Try after 24 hours from your last wrong attempt" });
        }

        return res.send({
          err: "Wrong password",
          wrong_attempts: login_error + 1,
          attempts_remaining: 5 - login_error - 1,
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
