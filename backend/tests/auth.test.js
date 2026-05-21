import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { connectTestDB, closeTestDB, clearTestDB } from "./setup.js";
import authRoute from "../routes/authRoute.js";

process.env.JWT_SECRET = "test_secret_for_jest";

const app = express();
app.use(express.json());
app.use("/api/auth", authRoute);

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe("POST /api/auth/register", () => {
  it("creates a new user and returns 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      firstName: "Alex",
      lastName: "Zhong",
      email: "alex@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/check your email/i);
  });

  it("rejects duplicate email with 409", async () => {
    const payload = {
      firstName: "Alex",
      lastName: "Zhong",
      email: "dup@example.com",
      password: "password123",
    };
    await request(app).post("/api/auth/register").send(payload);
    const res = await request(app).post("/api/auth/register").send(payload);
    expect(res.status).toBe(409);
  });

  it("rejects missing fields with 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "missing@example.com",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    // Register and manually verify so login can succeed
    await request(app).post("/api/auth/register").send({
      firstName: "Alex",
      lastName: "Zhong",
      email: "login@example.com",
      password: "password123",
    });
    // Manually mark as verified in DB for login test
    const User = (await import("../models/User.js")).default;
    await User.updateOne({ email: "login@example.com" }, { verified: true });
  });

  it("returns JWT on valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "password123",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects wrong password with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "login@example.com",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("rejects non-existent user with 401", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@example.com",
      password: "password123",
    });
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/verify-email", () => {
  let userEmail;

  beforeEach(async () => {
    userEmail = "verify@example.com";
    await request(app).post("/api/auth/register").send({
      firstName: "Alex",
      lastName: "Zhong",
      email: userEmail,
      password: "password123",
    });
  });

  it("rejects invalid code with 400", async () => {
    const res = await request(app).post("/api/auth/verify-email").send({
      email: userEmail,
      code: "000000",
    });
    expect(res.status).toBe(400);
  });

  it("accepts correct code and returns JWT", async () => {
    const User = (await import("../models/User.js")).default;
    const user = await User.findOne({ email: userEmail });
    const res = await request(app).post("/api/auth/verify-email").send({
      email: userEmail,
      code: user.emailVerificationToken,
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
