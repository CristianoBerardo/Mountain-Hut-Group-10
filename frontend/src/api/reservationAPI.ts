import type {
    CreateReservationDTO,
    CreateReservationResponseDTO
} from "../dto/ReservationDTO";
import { requestJSON } from "./request";

export async function createReservation(
    reservation: CreateReservationDTO
): Promise<CreateReservationResponseDTO> {
    return requestJSON<CreateReservationResponseDTO>("/reservations", "POST", reservation);
}
