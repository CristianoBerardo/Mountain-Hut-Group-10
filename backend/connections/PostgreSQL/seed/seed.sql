INSERT INTO "ticket" (
    id,
    code,
    service_type,
    status,
    creation_date,
    expiration_date
)
VALUES
(
    gen_random_uuid(),
    'A001',
    'Technical assistance',
    'QUEUE',
    NOW() - INTERVAL '20 minutes',
    NULL
),
(
    gen_random_uuid(),
    'A002',
    'Billing support',
    'SERVED',
    NOW() - INTERVAL '30 minutes',
    NOW() - INTERVAL '15 minutes'
),
(
    gen_random_uuid(),
    'A003',
    'Account management',
    'QUEUE',
    NOW() - INTERVAL '10 minutes',
    NULL
),
(
    gen_random_uuid(),
    'A004',
    'Technical assistance',
    'SERVED',
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '45 minutes'
),
(
    gen_random_uuid(),
    'A005',
    'General information',
    'QUEUE',
    NOW() - INTERVAL '5 minutes',
    NULL
),
(
    gen_random_uuid(),
    'A006',
    'Billing support',
    'QUEUE',
    NOW() - INTERVAL '2 minutes',
    NULL
),
(
    gen_random_uuid(),
    'A007',
    'Account management',
    'SERVED',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour 45 minutes'
),
(
    gen_random_uuid(),
    'A008',
    'Technical assistance',
    'QUEUE',
    NOW(),
    NULL
);

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