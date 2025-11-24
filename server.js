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

    const fullUser = await admin.auth().getUser(decode.uid);

    req.user = {
      uid: decode.uid,
      email: fullUser.providerData[0]?.email || decode.email,
      displayName: fullUser.displayName,
      providerId: fullUser.providerData[0]?.providerId || null,
    };

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
const blog_collection = database.collection('blogs');


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



// create blog
app.post("/create-blog", firebaseVerificationToken, async(req, res) => {

  const user = req.user;
  const get_data = req.body;

  const blog_data = {
    ...get_data,
    displayName: user.displayName,
    userId: user.email,
    user_uid: user.uid || null,
    created_at: new Date(),
    updated_at: new Date(),
  }

  try {
    await blog_collection.insertOne(blog_data);
    res.status(201).json({message: "Blog Published"});
  }catch(error){
    res.status(400).json({message: "Blog Publish Unsuccessful."});
  }
})



// get all blogs
app.get('/get-blogs', async(req, res) => {

  const result = await blog_collection.find({}, {projection: {content: 0, user_uid: 0, userId: 0} })
  .sort({ updated_at: -1 }) 
  .toArray();
  res.send(result);

})


// get blog details
app.get('/blog-details/:id', firebaseVerificationToken, async(req, res) => {
    try {
      const blog_id = req.params.id;
      const params = { _id: new ObjectId(blog_id) };
      const blog = await blog_collection.findOne(params);

      // user
      const email = blog.userId;
      const user = await user_collection.findOne({ email: email });

      // combined both result
      const result = {
        ...blog,
        userInfo: user || null,
      };

      res.send(result);
    }catch(error){
     res.status(404).json({message: "Blog Not Found."}); 
    }
})



//404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: "API not found",
  });
});