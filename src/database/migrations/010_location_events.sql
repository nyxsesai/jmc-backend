CREATE TABLE ride_location_updates (
  id bigserial PRIMARY KEY,
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  geog geography(Point, 4326) NOT NULL,
  heading_degrees numeric(5,2),
  speed_mps numeric(6,2),
  accuracy_meters numeric(7,2),
  battery_percent smallint CHECK (battery_percent BETWEEN 0 AND 100),
  captured_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ride_events (
  id bigserial PRIMARY KEY,
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);