CREATE TYPE ride_passenger_status AS ENUM ('accepted', 'picked_up', 'dropped_off', 'cancelled', 'no_show');

CREATE TABLE ride_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  request_id uuid UNIQUE REFERENCES ride_requests(id) ON DELETE SET NULL,
  passenger_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_geog geography(Point, 4326) NOT NULL,
  dropoff_geog geography(Point, 4326) NOT NULL,
  seats_reserved integer NOT NULL DEFAULT 1 CHECK (seats_reserved BETWEEN 1 AND 6),
  status ride_passenger_status NOT NULL DEFAULT 'accepted',
  picked_up_at timestamptz,
  picked_up_geog geography(Point, 4326),
  dropped_off_at timestamptz,
  dropped_off_geog geography(Point, 4326),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ride_id, passenger_id)
);