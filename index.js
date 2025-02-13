//comments services
const express = require("express");
const { randomBytes } = require("crypto");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const commentsByPostId = {};

app.get("/posts/:id/comments", (req, res) => {
   res.send(commentsByPostId[req.params.id] || []);
});

app.post("/posts/:id/comments", async (req, res) => {
   const commentId = randomBytes(4).toString("hex");
   const { content } = req.body;

   const comments = commentsByPostId[req.params.id] || [];

   comments.push({ id: commentId, content, status: "pending" });

   commentsByPostId[req.params.id] = comments;

   try {
      await axios.post("http://event-bus-srv:4005/events", {
         type: "CommentCreated",
         data: {
            id: commentId,
            content,
            status: "pending",
            postId: req.params.id,
         },
      });
   } catch (error) {
      console.error("Error posting event:", error.message);
   }

   res.status(201).send(comments);
   console.log(commentsByPostId);
});

app.post("/events", (req, res) => {
   console.log("Event Received:", req.body.type);

   const { type, data } = req.body;

   if (type === "CommentModerated") {
      const { postId, id, status } = data;
      const comments = commentsByPostId[postId];

      const comment = comments.find((comment) => {
         return comment.id === id;
      });

      comment.status = status;
   }

   res.send({});
});

const port = 4001;
app.listen(port, () => {
   console.log(`listening to port ${port}`);
});
