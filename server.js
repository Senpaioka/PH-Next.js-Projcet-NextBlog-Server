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
    // 'http://localhost:3000' 
    'https://ph-next-js-projcet-next-blog-client.vercel.app' 
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
const bookmark_collection = database.collection('bookmarks');


  /* API Calls */

// cookie setup
app.post("/set-token", (req, res) => {
  
  const { token } = req.body;

  res.cookie("token", token, {
    httpOnly: true,
    // secure: process.env.NODE_ENV === "production",
    secure: true, 
    // sameSite: "Strict",
    sameSite: "none", 
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





// Add a bookmark
app.post('/bookmark/:blogId', firebaseVerificationToken, async (req, res) => {
  const user = req.user;
  const blogId = req.params.blogId;

  try {
    const exists = await bookmark_collection.findOne({
      userId: user.email,
      blogId,
    });

    if (exists) {
      return res.status(400).json({ message: 'Already bookmarked' });
    }

    await bookmark_collection.insertOne({
      userId: user.email,
      blogId,
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Bookmark added' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add bookmark' });
  }
});


// Remove a bookmark
app.delete('/bookmark/:blogId', firebaseVerificationToken, async (req, res) => {
  const user = req.user;
  const blogId = req.params.blogId;

  try {
    await bookmark_collection.deleteOne({
      userId: user.email,
      blogId,
    });
    res.status(200).json({ message: 'Bookmark removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to remove bookmark' });
  }
});


// Get user's bookmarks
app.get('/bookmarks', firebaseVerificationToken, async (req, res) => {
  const user = req.user;

  try {
    const bookmarks = await bookmark_collection
      .find({ userId: user.email })
      .toArray();

    res.json(bookmarks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch bookmarks' });
  }
});


// get bookmarked full blog
app.get("/saved-blog", firebaseVerificationToken, async (req, res) => {
  const user = req.user;
  const email = user.email;

  try {
    // 1. Get all bookmarks for this user
    const bookmarks = await bookmark_collection
      .find({ userId: email }) // assuming you store userId/email in bookmarks
      .toArray();

    // 2. Extract blog IDs
    const blogIds = bookmarks.map((b) => new ObjectId(b.blogId));

    if (blogIds.length === 0) {
      return res.json([]); // No bookmarks
    }

    // 3. Fetch full blog details
    const blogs = await blog_collection
      .find({ _id: { $in: blogIds } })
      .sort({ createdAt: -1 })
      .toArray();

    // 4. Return blogs
    res.send(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bookmarked blogs" });
  }
});



// get user blogs
app.get('/my-blogs', firebaseVerificationToken, async(req, res) => {
  
  const email = req.user?.email;

  if (!email) {
      return res.status(400).json({ message: "Invalid user data." });
    }

  try {
    const result = await blog_collection
    .find({userId: email})
    .sort({updated_at: -1})
    .toArray();

    res.send(result);
  } catch(error) {
    console.log(error);
    res.status(404).json({ message: "User Blogs Not Found." });
  }
})


// delete user own blog
app.delete('/blog/:id', firebaseVerificationToken, async (req, res) => {
  try {
    const userId = req.user?.email;     // Authenticated user email
    const blogId = req.params.id;       // Blog ID in URL

    // --- Validate input ---
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    if (!blogId || blogId.length !== 24) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    // --- Convert to ObjectId safely ---
    const objectId = new ObjectId(blogId);

    // --- Find the blog first ---
    const blog = await blog_collection.findOne({ _id: objectId });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // --- Check ownership ---
    if (blog.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot delete this blog" });
    }

    // --- Proceed with delete ---
    await blog_collection.deleteOne({ _id: objectId });

    return res.json({ message: "Blog deleted successfully" });

  } catch (error) {
    console.error("Delete Blog Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});



// get user blog data for update
app.get('/blog-data/:id', firebaseVerificationToken, async (req, res) => {
  const userId = req.user?.email;
  const blogId = req.params.id;

  try {
    // Validate user
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    // Validate blogId
    if (!blogId || !ObjectId.isValid(blogId)) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    const objectId = new ObjectId(blogId);

    // Fetch the blog for this user only
    const blog = await blog_collection.findOne({ _id: objectId, userId });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found or you do not have access" });
    }

    res.json(blog);

  } catch (error) {
    console.error("Error fetching blog data:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// updating blog
app.post('/update-blog/:blogId', firebaseVerificationToken, async (req, res) => {
  try {
    const userId = req.user?.email;           // authenticated user
    const blogId = req.params.blogId;         // blog ID
    const updatedData = req.body;             // updated fields from frontend

    // --- Validate inputs ---
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!blogId || blogId.length !== 24) {
      return res.status(400).json({ message: "Invalid blog ID" });
    }

    // validate updatedData fields
    const allowedFields = ["title", "category", "shortDesc", "imageUrl", "content"];
    const updatePayload = {};
    for (const key of allowedFields) {
      if (updatedData[key] && updatedData[key].trim() !== "") {
        updatePayload[key] = updatedData[key].trim();
      }
    }

    // Add timestamp
    updatePayload.updated_at = new Date();

    // --- Convert blogId safely ---
    const objectId = new ObjectId(blogId);

    // --- Find the blog ---
    const blog = await blog_collection.findOne({ _id: objectId });

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // --- Check ownership ---
    if (blog.userId !== userId) {
      return res.status(403).json({ message: "Forbidden: You cannot update this blog" });
    }

    // --- Perform update ---
    const result = await blog_collection.updateOne(
      { _id: objectId },
      { $set: updatePayload }
    );

    return res.json({ message: "Blog updated successfully", updatedFields: updatePayload });

  } catch (error) {
    console.error("Update Blog Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});



//404
app.all(/.*/, (req, res) => {
  res.status(404).json({
    status: 404,
    error: "API not found",
  });
});