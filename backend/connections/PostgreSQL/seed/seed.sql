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

INSERT INTO "user" (username, password, role)
VALUES
    ('admin', 'admin123', 'ADMIN'),
    ('admin2', 'admin456', 'ADMIN'),
    ('operator1', 'operator123', 'OPERATOR'),
    ('operator2', 'operator456', 'OPERATOR'),
    ('operator3', 'operator789', 'OPERATOR');