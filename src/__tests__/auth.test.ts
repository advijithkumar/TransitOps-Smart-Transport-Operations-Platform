import request from "supertest";
import app from "../app";
import { prisma } from "../config/database";

describe("Auth API Integration Tests", () => {
  const testEmail = `test-${Date.now()}@transitops.test`;
  let accessToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: ".test" } } });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail,
        password: "TestPassword123",
        name: "Test Driver",
        roleName: "DRIVER",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testEmail);
    });

    it("should reject duplicate email registration", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: testEmail,
        password: "TestPassword123",
        name: "Test Duplicate",
        roleName: "DRIVER",
      });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing required fields", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "invalid-email",
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "TestPassword123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      accessToken = res.body.data.accessToken;
    });

    it("should reject incorrect password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: testEmail,
        password: "WrongPassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@transitops.test",
        password: "SomePassword",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout and blacklist the token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject request with blacklisted token", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe("GET /health", () => {
    it("should return healthy status", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("healthy");
    });
  });
});
