### backend
```
const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//middlware
app.set("view engine", "ejs"); //setting engine to run ejs extension file
app.use(express.json()); //setting)
app.use(express.urlencoded({ extended: true })); //
app.use(cookieParser());

```
 