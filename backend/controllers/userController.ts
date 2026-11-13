import { Request, Response } from "express";
import { UserRepository } from "../repository/UserRepository";
import { UserDTO } from "../types/UserDTOType";

export class UserController {
  private userRespository: UserRepository;

  constructor() {
    this.userRespository = new UserRepository();
  }

  async getUsers(req: Request, res: Response, next: Function): Promise<void> {
    try {
      const result: UserDTO[] = await this.userRespository.getUsers();

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUserByFirebaseUid(
    req: Request,
    res: Response,
    next: Function,
  ): Promise<void> {
    try {
      const { firebase_uid } = req.params;

      const firebaseUidTrimmed = firebase_uid.trim();

      if (firebaseUidTrimmed.length === 0) {
        throw new Error("Firebase_uid is required");
      }

      const user = await this.userRespository.getUserByFirebaseUid({
        firebase_uid: firebaseUidTrimmed,
      });

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }
}
