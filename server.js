const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const admin = require('./firebaseAdmin');
require('dotenv').config();



// middlewares
// app.use(cors());

app.use(cors({
  origin: [
    'http://localhost:3000' // deployed client
  ],
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));



app.use(express.json());




const firebaseVerificationToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    const decode = await admin.auth().verifyIdToken(token);
    req.user = decode;

    // continue
    next();

  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};




// log report
app.use(async (req, res, next) => {
  console.log(`⚡ ${req.method} - ${req.path} from ${ req.host} at ⌛ ${new Date().toLocaleString()}`);
  next();
});


//ports & clients [MongoDB]
const port = process.env.PORT || 8088;
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


//listeners
client.connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening ${port}`);
      console.log(`Server Connected to MongoDB`);
    });
  })
  .catch((err) => {
    console.log(err);
  });



// database setup
const database = client.db('next-blog');
const user_collection = database.collection('users');


  /* API Calls */

// cookie setup
app.post("/set-token", (req, res) => {
  
  const { token } = req.body;

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  });

  res.send({ message: "Token saved in cookie" });
});


// clear token from cookies
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return res.send({ message: "Logged out successfully" });
});


// verify cookie/token
// app.get("/verify-token", firebaseVerificationToken, (req, res) => {
//   res.send({ valid: true });
// });


// Basic routes
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "NextBlog Server Active" });
});


//  user registration
app.post("/registration",firebaseVerificationToken, async(req, res) => {

    const newUser = req.body;
    const email = newUser.email;

    const isUserAlreadyExists = await user_collection.findOne({email: email});

    if (isUserAlreadyExists) {
          res.status(409).json({ message: 'user already exists' })
      } else {
          newUser.created_at = new Date();
          await user_collection.insertOne(newUser);
          res.status(201).json({message: "Registration Successful."});
      }
});





//404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: "API not found",
  });
});