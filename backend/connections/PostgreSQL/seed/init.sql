CREATE TABLE IF NOT EXISTS "user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    surname TEXT,
    email TEXT NOT NULL UNIQUE,
    mobile_number TEXT,
    notes TEXT,
    emergency_contact TEXT,
    role TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dining_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number SMALLINT NOT NULL UNIQUE CHECK (table_number > 0),
    capacity SMALLINT NOT NULL CHECK (capacity > 0),
    occupancy SMALLINT NOT NULL DEFAULT 0 CHECK (occupancy >= 0 AND occupancy <= capacity),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS meal_slot (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    date        DATE        NOT NULL,
    starts_at   TIME        NOT NULL,          -- e.g. '12:00'
    ends_at     TIME        NOT NULL,          -- e.g. '13:00'
    -- created_by  UUID        NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT meal_slot_end_after_start CHECK (ends_at > starts_at),
    CONSTRAINT meal_slot_unique UNIQUE (date, starts_at, ends_at)
);

CREATE TABLE IF NOT EXISTS meal_reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hiker_id UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    slot_id UUID NOT NULL REFERENCES meal_slot(id) ON DELETE RESTRICT,
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


CREATE TABLE IF NOT EXISTS slot_table (
    slot_id           UUID        NOT NULL REFERENCES meal_slot(id) ON DELETE CASCADE,
    dining_table_id   UUID        NOT NULL REFERENCES dining_table(id) ON DELETE RESTRICT,
    -- seats_in_slot     SMALLINT    NOT NULL CHECK (seats_in_slot > 0),
    PRIMARY KEY (slot_id, dining_table_id)
);

CREATE INDEX IF NOT EXISTS slot_table_slot_id_idx ON slot_table (slot_id);

CREATE INDEX IF NOT EXISTS meal_reservation_hiker_starts_at_idx
    ON meal_reservation (hiker_id, starts_at);

CREATE INDEX IF NOT EXISTS reservation_table_dining_table_id_idx
    ON reservation_table (dining_table_id);