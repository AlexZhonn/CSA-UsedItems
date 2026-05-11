import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoute.js";
import profileRoutes from "./routes/profileRoute.js";
import postRoutes from "./routes/postRoute.js";
import connectMongo from "./db/mongo.js";
import dotenv from "dotenv";
import featureRoutes from "./routes/featureRoute.js";
import { requireAuth } from "@clerk/express";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json({ limit: "10mb" }));
app.use(cors());

app.use("/api/users", requireAuth(), userRoutes); //using the clerk built-in middleware, helping checking if the clerkId is real.
app.use("/api/posts", postRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/features", featureRoutes);
connectMongo();
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
