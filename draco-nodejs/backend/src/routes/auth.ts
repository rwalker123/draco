import { Router, Request, Response, NextFunction } from "express";
import {
  AuthService,
  LoginCredentials,
  RegisterData,
} from "../services/authService";
import { authenticateToken } from "../middleware/authMiddleware";
import { RoleService } from "../services/roleService";
import { PrismaClient } from "@prisma/client";

const router = Router();
const authService = new AuthService();
const prisma = new PrismaClient();
const roleService = new RoleService(prisma);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username and password
 *     description: Authenticate a user and return a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password }: LoginCredentials = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({
          success: false,
          message: "Username and password are required",
        });
        return;
      }

      const result = await authService.login({ username, password });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Login route error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with the provided information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterData'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password, firstName, lastName }: RegisterData =
        req.body;

      // Validate input
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          message: "Username, email, and password are required",
        });
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Invalid email format",
        });
        return;
      }

      const result = await authService.register({
        username,
        email,
        password,
        firstName,
        lastName,
      });

      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Register route error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout endpoint (JWT tokens are stateless, so logout is handled client-side)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 */
router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  // JWT tokens are stateless, so logout is handled client-side
  // This endpoint can be used for logging purposes
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve information about the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User information retrieved
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: User not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  "/me",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      // Fetch first and last name from contacts table
      let firstname = undefined;
      let lastname = undefined;
      try {
        const contact = await prisma.contacts.findFirst({
          where: { userid: req.user.id },
          select: { firstname: true, lastname: true },
        });
        if (contact) {
          firstname = contact.firstname;
          lastname = contact.lastname;
        }
      } catch (e) {
        // If contacts table is missing or error, just skip
      }

      res.status(200).json({
        success: true,
        message: "User information retrieved",
        user: {
          id: req.user.id,
          username: req.user.username,
          firstname,
          lastname,
        },
      });
    } catch (error) {
      console.error("Get user info error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify JWT token
 *     description: Verify if a JWT token is valid and return user information
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token to verify
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token is valid
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token is invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/verify",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: "Token is required",
        });
        return;
      }

      const result = await authService.verifyToken(token);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     description: Change the password for the currently authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 description: New password (minimum 6 characters)
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: User not authenticated or current password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  "/change-password",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: "Current password and new password are required",
        });
        return;
      }

      // Validate password strength
      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
        return;
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword,
      );

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post(
  "/refresh",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await authService.refreshToken(req.user.id);

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

/**
 * GET /api/auth/check-role/:roleId
 * Check if current user has a specific role
 */
router.get(
  "/check-role/:roleId",
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const { roleId } = req.params;
      const { accountId, teamId, leagueId } = req.query;

      const context = {
        accountId: accountId ? BigInt(accountId as string) : undefined,
        teamId: teamId ? BigInt(teamId as string) : undefined,
        leagueId: leagueId ? BigInt(leagueId as string) : undefined,
      };

      const roleCheck = await roleService.hasRole(req.user.id, roleId, context);

      res.status(200).json({
        success: true,
        hasRole: roleCheck.hasRole,
        roleLevel: roleCheck.roleLevel,
        context: roleCheck.context,
      });
    } catch (error) {
      console.error("Role check error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  },
);

export default router;
