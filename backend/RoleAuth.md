| Resource     | HTTP Method | Endpoint                                  | USER | HIKER   | EMPLOYEE | WARDEN  |
| ------------ | ----------- | ----------------------------------------- | ---- | ------- | -------- | ------- |
| Auth         | POST        | `/api/v1/auth/login`                      | No   | **Yes** | **Yes**  | **Yes** |
| Auth         | POST        | `/api/v1/auth/register`                   | No   | **Yes** | **Yes**  | **Yes** |
| Tables       | POST        | `/api/v1/tables`                          | No   | No      | **Yes**  | **Yes** |
| Tables       | GET         | `/api/v1/tables/{tableId}`                | No   | No      | **Yes**  | **Yes** |
| Tables       | PATCH       | `/api/v1/tables/{tableId}`                | No   | No      | **Yes**  | **Yes** |
| Tables       | DELETE      | `/api/v1/tables/{tableId}`                | No   | No      | **Yes**  | **Yes** |
| Tables       | GET         | `/api/v1/tables/number/{tableNumber}`     | No   | No      | **Yes**  | **Yes** |
| Tables       | PATCH       | `/api/v1/tables/{tableId}/reset`          | No   | No      | **Yes**  | **Yes** |
| Reservations | GET         | `/api/v1/reservations`                    | No   | No      | **Yes**  | **Yes** |
| Reservations | POST        | `/api/v1/reservations`                    | No   | **Yes** | **Yes**  | **Yes** |
| Reservations | GET         | `/api/v1/reservations/{reservationId}`    | No   | **Yes** | **Yes**  | **Yes** |
| Reservations | PATCH       | `/api/v1/reservations/{reservationId}`    | No   | **Yes** | **Yes**  | **Yes** |
| Reservations | DELETE      | `/api/v1/reservations/{reservationId}`    | No   | **Yes** | **Yes**  | **Yes** |
| Slots        | GET         | `/api/v1/slots`                           | No   | No      | **Yes**  | **Yes** |
| Slots        | POST        | `/api/v1/slots`                           | No   | No      | **Yes**  | **Yes** |
| Slots        | GET         | `/api/v1/slots/{slotId}`                  | No   | No      | **Yes**  | **Yes** |
| Slots        | DELETE      | `/api/v1/slots/{slotId}`                  | No   | No      | **Yes**  | **Yes** |
| Slots        | GET         | `/api/v1/slots/{slotId}/details`          | No   | No      | **Yes**  | **Yes** |
| Slots        | GET         | `/api/v1/slots/available`                 | No   | **Yes** | **Yes**  | **Yes** |
| Slots        | POST        | `/api/v1/slots/{slotId}/tables`           | No   | No      | **Yes**  | **Yes** |
| Slots        | DELETE      | `/api/v1/slots/{slotId}/tables/{tableId}` | No   | No      | **Yes**  | **Yes** |
| Users        | GET         | `/api/v1/users/`                          | No   | No      | **Yes**  | **Yes** |

### Role legend

| Role         | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| **USER**     | Anyone accessing the public web pages without authentication.     |
| **HIKER**    | A registered visitor acting individually or on behalf of a party. |
| **WARDEN**   | Manages the hut and oversees operational decisions.               |
| **EMPLOYEE** | Carries out the hut’s day-to-day work.                            |
