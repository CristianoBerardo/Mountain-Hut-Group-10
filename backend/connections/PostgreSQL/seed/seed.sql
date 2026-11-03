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
    ('ttaYYFmOa3TYYVdGby6k5LS0kc12', 'Isabella', 'Rossi', 'isabella@example.com', '6666666666', NULL, '6666666667', 'EMPLOYEE');

INSERT INTO dining_table (table_number, capacity)
VALUES
    (1, 2),
    (2, 2),
    (3, 4),
    (4, 4),
    (5, 6);


INSERT INTO meal_slot (id, date, starts_at, ends_at)
VALUES
    ('a1111111-1111-1111-1111-111111111111', CURRENT_DATE, '12:00', '13:30'),
    ('a2222222-2222-2222-2222-222222222222', CURRENT_DATE, '13:30', '15:00'),
    ('a3333333-3333-3333-3333-333333333333', CURRENT_DATE, '19:30', '21:00')
ON CONFLICT DO NOTHING;

INSERT INTO slot_table (slot_id, dining_table_id, seats_in_slot)
SELECT 
    'a1111111-1111-1111-1111-111111111111',
    id,
    capacity
FROM dining_table
ON CONFLICT DO NOTHING;

INSERT INTO slot_table (slot_id, dining_table_id, seats_in_slot)
SELECT 
    'a2222222-2222-2222-2222-222222222222',
    id,
    capacity
FROM dining_table
WHERE table_number IN (1, 2, 3)
ON CONFLICT DO NOTHING;