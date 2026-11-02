INSERT INTO "user" (username, password, role)
VALUES
    ('admin', 'admin123', 'ADMIN'),
    ('admin2', 'admin456', 'ADMIN'),
    ('operator1', 'operator123', 'OPERATOR'),
    ('operator2', 'operator456', 'OPERATOR'),
    ('operator3', 'operator789', 'OPERATOR');

INSERT INTO dining_table (table_number, capacity)
VALUES
    (1, 2),
    (2, 2),
    (3, 4),
    (4, 4),
    (5, 6);