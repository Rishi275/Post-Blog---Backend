const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();
//middlware
app.set("view engine", "ejs"); //setting engine to run ejs extension file
app.use(express.json()); //setting)
app.use(express.urlencoded({ extended: true })); //
app.use(cookieParser());
// -------------------------------
const JWT_KEY = process.env.JWT_KEY;
if (!JWT_KEY) {
  throw new Error("JWT_KEY is not defined. Check your environment variables.");
}

console.log(JWT_KEY, "jj")
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    // Fetch user and populate posts
    const user = await userModel.findOne({ email: req.user.email }).populate("posts");
    
    if (!user) {
      return res.status(404).render("error", { message: "User not found" });
    }

    // Render the profile view with the user data
    res.render("profile",{user} );
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).render("error", { message: "An error occurred while fetching the profile" });
  }
});

app.post("/register", async (req, res) => {
  let { email, password, username, name, age } = req.body;
  let user = await userModel.findOne({ email: email });

  if (user) {
    return res.status(500).send("user already registered");
  }
  bcrypt.genSalt(10, (arr, salt) => {
    bcrypt.hash(password, salt, async (arr, hash) => {
      // console.log(hash)

      let user = await userModel.create({
        email: email,
        password: hash,
        username: username,
        name: name,
        age: age,
        // posts: [
        //   { type: mongoose.Schema.Types.ObjectId, ref: "post" }, // it will stor post id only from post schema model
        // ],
      });

      let token = jwt.sign({ email: email, userid: user._id }, JWT_KEY);

      res.cookie("token", token);
      res.render("registered");
      console.log(user);
    });
  });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found!");
    }

    // Compare the provided password with the hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      let token = jwt.sign({ email: email, userid: user._id }, JWT_KEY);
      res.cookie("token", token);
      // return res.status(200).send("You can login");
      res.redirect("/profile")
      return res.render("profile")
    } else {
      return res.status(401).send("Invalid email or password");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send("An internal server error occurred");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token"); // also res.cookie("token","")
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  try {
    const token = req.cookies.token;

    // Check if token exists
    if (!token) {
      return res.status(401).send("You must be logged in to access this resource");
    }

    // Verify the token
    const data = jwt.verify(token, JWT_KEY);
    req.user = data; // Attach the decoded data to the request object

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error(err);
    return res.status(403).send("Invalid or expired token");
  }
}

app.post('/post', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).send('Content cannot be empty');
    }

    const post = await postModel.create({
      user: user._id,
      content: content.trim(),
    });

    user.posts.push(post._id);
    await user.save();

    // Redirect to a more appropriate route
    res.redirect('/profile'); // or wherever you'd like to show the user's posts
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while creating the post');
  }
});


app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
