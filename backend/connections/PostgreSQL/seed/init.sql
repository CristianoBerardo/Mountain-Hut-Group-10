CREATE TABLE IF NOT EXISTS "ticket" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    service_type TEXT NOT NULL,
    status TEXT NOT NULL,
    creation_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiration_date TIMESTAMPTZ NULL
);

CREATE SEQUENCE IF NOT EXISTS ticket_code_seq START WITH 9;

CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dining_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number SMALLINT NOT NULL UNIQUE CHECK (table_number > 0),
    capacity SMALLINT NOT NULL CHECK (capacity > 0),
    occupancy SMALLINT NOT NULL DEFAULT 0 CHECK (occupancy >= 0 AND occupancy <= capacity),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS meal_reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hiker_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT meal_reservation_end_after_start CHECK (ends_at > starts_at),
    party_size SMALLINT NOT NULL CHECK (party_size > 0),
    status TEXT NOT NULL DEFAULT 'CONFIRMED'
        CHECK (status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservation_table (
    reservation_id UUID NOT NULL
        REFERENCES meal_reservation(id) ON DELETE RESTRICT,
    dining_table_id UUID NOT NULL
        REFERENCES dining_table(id) ON DELETE RESTRICT,
    seats_assigned SMALLINT NOT NULL CHECK (seats_assigned > 0),
    PRIMARY KEY (reservation_id, dining_table_id)
);

CREATE INDEX IF NOT EXISTS meal_reservation_hiker_starts_at_idx
    ON meal_reservation (hiker_id, starts_at);

CREATE INDEX IF NOT EXISTS reservation_table_dining_table_id_idx
    ON reservation_table (dining_table_id);