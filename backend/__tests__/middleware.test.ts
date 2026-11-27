import { Request, Response, NextFunction } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import { authorizeRole } from "../middleware/authorizeRole";
import { errorHandler } from "../middleware/errorHandler";
import { adminAuth } from "../config/firebaseAdmin";
import {
  AppError,
  NotFoundError,
  InternalServerError,
  TokenMissingOrInvalidError,
  InsufficientPermissionsError,
} from "../errors/AppError";
import { UserRole } from "../types/UserRole";

jest.mock("../config/firebaseAdmin", () => ({
  adminAuth: {
    verifyIdToken: jest.fn(),
  },
}));

describe("Middleware Unit Tests", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    req = { headers: {} };
    res = {
      locals: {},
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("authenticateToken", () => {
    it("throws TokenMissingOrInvalidError when Authorization header is absent", async () => {
      req.headers = {};
      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TokenMissingOrInvalidError));
    });

    it("throws TokenMissingOrInvalidError when Authorization header format is invalid", async () => {
      req.headers = { authorization: "Basic token123" };
      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TokenMissingOrInvalidError));
    });

    it("verifies ID token and stores user in res.locals", async () => {
      req.headers = { authorization: "Bearer valid-token-abc" };
      const decodedToken = { uid: "user-123", role: UserRole.HIKER };
      (adminAuth.verifyIdToken as jest.Mock).mockResolvedValueOnce(decodedToken);

      await authenticateToken(req as Request, res as Response, next);

      expect(adminAuth.verifyIdToken).toHaveBeenCalledWith("valid-token-abc");
      expect(res.locals!.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalledWith();
    });

    it("handles known Firebase auth error codes as TokenMissingOrInvalidError", async () => {
      req.headers = { authorization: "Bearer expired-token" };
      (adminAuth.verifyIdToken as jest.Mock).mockRejectedValueOnce({
        code: "auth/id-token-expired",
        message: "Token has expired",
      });

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TokenMissingOrInvalidError));
    });

    it("passes AppError through to next", async () => {
      req.headers = { authorization: "Bearer custom-app-error" };
      const appErr = new NotFoundError("Not found");
      (adminAuth.verifyIdToken as jest.Mock).mockRejectedValueOnce(appErr);

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(appErr);
    });

    it("wraps unexpected errors into InternalServerError", async () => {
      req.headers = { authorization: "Bearer crash-token" };
      (adminAuth.verifyIdToken as jest.Mock).mockRejectedValueOnce(
        new Error("Unexpected crash"),
      );

      await authenticateToken(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(InternalServerError));
    });
  });

  describe("authorizeRole", () => {
    it("throws TokenMissingOrInvalidError when role is not present in res.locals.user", () => {
      res.locals = {};
      const middleware = authorizeRole(UserRole.EMPLOYEE);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(TokenMissingOrInvalidError));
    });

    it("throws InsufficientPermissionsError when user role is not allowed", () => {
      res.locals = { user: { role: UserRole.HIKER } };
      const middleware = authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(
        expect.any(InsufficientPermissionsError),
      );
    });

    it("calls next() when user role is in allowedRoles", () => {
      res.locals = { user: { role: UserRole.EMPLOYEE } };
      const middleware = authorizeRole(UserRole.EMPLOYEE, UserRole.WARDEN);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("errorHandler", () => {
    it("delegates to Express default handler when headers were already sent", () => {
      res.headersSent = true;
      const err = new Error("Already sent");

      errorHandler(err, req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("formats client AppError (status < 500) correctly", () => {
      const notFound = new NotFoundError("Resource missing");

      errorHandler(notFound, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        code: "NOT_FOUND",
        error: "Resource missing",
      });
    });

    it("formats server AppError (status >= 500) and logs error", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const serverErr = new InternalServerError("Internal crash");

      errorHandler(serverErr, req as Request, res as Response, next);

      expect(consoleSpy).toHaveBeenCalledWith(serverErr);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: "INTERNAL_SERVER_ERROR",
        error: "Internal crash",
      });
      consoleSpy.mockRestore();
    });

    it("formats unexpected generic Error as 500", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();
      const err = new Error("Something broke");

      errorHandler(err, req as Request, res as Response, next);

      expect(consoleSpy).toHaveBeenCalledWith(err);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        code: "INTERNAL_SERVER_ERROR",
        error: "Internal server error",
      });
      consoleSpy.mockRestore();
    });
  });
});
