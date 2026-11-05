INSERT INTO "user" (
    firebase_uid,
    name,
    surname,
    email,
    mobile_number,
    notes,
    emergency_contact,
    role
)
VALUES
    ('firebase-admin-uid', 'Admin', 'User', 'admin@example.com', '1111111111', NULL, '1111111112', 'WARDEN'),
    ('firebase-admin2-uid', 'Admin2', 'User', 'admin2@example.com', '2222222222', NULL, '2222222223', 'EMPLOYEE'),
    ('firebase-operator1-uid', 'Operator1', 'User', 'operator1@example.com', '3333333333', NULL, '3333333334', 'EMPLOYEE'),
    ('firebase-operator2-uid', 'Operator2', 'User', 'operator2@example.com', '4444444444', NULL, '4444444445', 'WARDEN'),
    ('firebase-operator3-uid', 'Operator3', 'User', 'operator3@example.com', '5555555555', NULL, '5555555556', 'HIKER'),
    ('ttaYYFmOa3TYYVdGby6k5LS0kc12', 'Isabella', 'Rossi', 'isabella@example.com', '6666666666', NULL, '6666666667', 'EMPLOYEE'),
    -- Test employee, login in DEV.md > "Test accounts"
    ('b8LlOMlDidUE1bvn0ihxOGkO2oz1', 'Employee', 'Test', 'e@e.com', '3334445555', NULL, NULL, 'EMPLOYEE');

INSERT INTO dining_table (table_number, capacity)
VALUES
    (1, 2),
    (2, 2),
    (3, 4),
    (4, 4),
    (5, 6);

-- MEAL SLOTS
-- All dates are in the future relative to 2026-11-03 so the 2-hour rule never
-- blocks Postman testing from day one.
INSERT INTO meal_slot (id, date, starts_at, ends_at)
VALUES
    -- Slot A: 2026-11-10 lunch service (12:00–13:00) — all 5 tables
    ('aaaaaaaa-0001-0001-0001-000000000001', '2026-11-10', '12:00', '13:00'),
    -- Slot B: 2026-11-10 second lunch shift (13:00–14:00) — larger tables only
    ('aaaaaaaa-0002-0002-0002-000000000002', '2026-11-10', '13:00', '14:00'),
    -- Slot C: 2026-11-10 dinner (19:00–20:30) — all 5 tables
    ('aaaaaaaa-0003-0003-0003-000000000003', '2026-11-10', '19:00', '20:30'),
    -- Slot D: 2026-11-15 lunch (12:00–13:30) — smaller tables only
    ('aaaaaaaa-0004-0004-0004-000000000004', '2026-11-15', '12:00', '13:30');

-- SLOT_TABLE  --> associate tables with each slot
-- dining_table IDs are resolved dynamically via subqueries so the seed is
-- robust even if the dining_table UUIDs are auto-generated.

-- Slot A: all five tables (2+2+4+4+6 = 18 total seats)
INSERT INTO slot_table (slot_id, dining_table_id)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', id
FROM dining_table
WHERE table_number IN (1, 2, 3, 4, 5);

-- Slot B: larger tables only — tables 3,4,5 (4+4+6 = 14 total seats)
INSERT INTO slot_table (slot_id, dining_table_id)
SELECT 'aaaaaaaa-0002-0002-0002-000000000002', id
FROM dining_table
WHERE table_number IN (3, 4, 5);

-- Slot C: all five tables (same layout as Slot A)
INSERT INTO slot_table (slot_id, dining_table_id)
SELECT 'aaaaaaaa-0003-0003-0003-000000000003', id
FROM dining_table
WHERE table_number IN (1, 2, 3, 4, 5);

-- Slot D: small tables — tables 1,2,3 (2+2+4 = 8 total seats)
INSERT INTO slot_table (slot_id, dining_table_id)
SELECT 'aaaaaaaa-0004-0004-0004-000000000004', id
FROM dining_table
WHERE table_number IN (1, 2, 3);

-- ─────────────────────────────────────────────────────────────────────────────
-- MEAL RESERVATIONS  —  two example reservations for Postman testing
-- ─────────────────────────────────────────────────────────────────────────────

-- Reservation 1: hiker (firebase-operator3-uid) books 3 people on Slot A
--   -> assigned to table_number=3 (capacity 4, 3 seats used, 1 free)
INSERT INTO meal_reservation (id, hiker_id, slot_id, party_size, starts_at, ends_at, status)
SELECT
    'bbbbbbbb-0001-0001-0001-000000000001',
    u.id,
    'aaaaaaaa-0001-0001-0001-000000000001',
    3,
    '2026-11-10T12:00:00Z',
    '2026-11-10T13:00:00Z',
    'CONFIRMED'
FROM "user" u
WHERE u.firebase_uid = 'firebase-operator3-uid';

INSERT INTO reservation_table (reservation_id, dining_table_id, seats_assigned)
SELECT
    'bbbbbbbb-0001-0001-0001-000000000001',
    dt.id,
    3
FROM dining_table dt
WHERE dt.table_number = 3;

-- Reservation 2: admin (firebase-admin-uid) books 2 people on Slot C (dinner)
--   -> assigned to table_number=1 (capacity 2, fully occupied)
INSERT INTO meal_reservation (id, hiker_id, slot_id, party_size, starts_at, ends_at, status)
SELECT
    'bbbbbbbb-0002-0002-0002-000000000002',
    u.id,
    'aaaaaaaa-0003-0003-0003-000000000003',
    2,
    '2026-11-10T19:00:00Z',
    '2026-11-10T20:30:00Z',
    'CONFIRMED'
FROM "user" u
WHERE u.firebase_uid = 'firebase-admin-uid';

INSERT INTO reservation_table (reservation_id, dining_table_id, seats_assigned)
SELECT
    'bbbbbbbb-0002-0002-0002-000000000002',
    dt.id,
    2
FROM dining_table dt
WHERE dt.table_number = 1;
