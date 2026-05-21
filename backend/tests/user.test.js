import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { connectTestDB, closeTestDB, clearTestDB } from "./setup.js";
import userRoute from "../routes/userRoute.js";
import requireAuth from "../middleware/auth.js";

process.env.JWT_SECRET = "test_secret_for_jest";

const app = express();
app.use(express.json());
app.use("/api/users", requireAuth, userRoute);

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

async function createTestUser(overrides = {}) {
  const User = (await import("../models/User.js")).default;
  return User.create({
    firstName: "Alex",
    lastName: "Zhong",
    email: "test@example.com",
    passwordHash: "hashed",
    verified: true,
    ...overrides,
  });
}

describe("GET /api/users/me", () => {
  it("returns the current user's document", async () => {
    const user = await createTestUser();
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@example.com");
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/users/profile", () => {
  it("returns current user profile", async () => {
    const user = await createTestUser();
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe("Alex");
  });
});

describe("PUT /api/users/profile", () => {
  it("updates user profile fields", async () => {
    const user = await createTestUser();
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ firstName: "Updated", bio: "Hello CSA!" });

    expect(res.status).toBe(200);
    expect(res.body.data.firstName).toBe("Updated");
    expect(res.body.data.description).toBe("Hello CSA!");
  });
});
