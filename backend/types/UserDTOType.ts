import { EmployeeDTO } from "../models/dto/EmployeeDTO";
import { HikerDTO } from "../models/dto/HikerDTO";
import { WardenDTO } from "../models/dto/Warden";

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

export type UserDTO = HikerDTO | EmployeeDTO | WardenDTO;

export type createHikerDTO = WithoutId<HikerDTO>;
