import type {
    CreateReservationDTO,
    CreateReservationResponseDTO
} from "../dto/ReservationDTO";
import { requestJSON } from "./request";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/api/v1/reservations`;

export async function createReservation(
    reservation: CreateReservationDTO
): Promise<CreateReservationResponseDTO> {
    return requestJSON<CreateReservationResponseDTO>(API_BASE_URL, "POST", reservation);
}
