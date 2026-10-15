CREATE TYPE ride_status AS ENUM ('draft', 'published', 'driving', 'completed', 'cancelled', 'expired');

CREATE TABLE rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES vehicles(id) ON DELETE SET NULL,
  origin_place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  destination_place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  origin_geog geography(Point, 4326) NOT NULL,
  destination_geog geography(Point, 4326) NOT NULL,
  route_geog geography(LineString, 4326),
  corridor_geog geography(Polygon, 4326),
  departure_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz,
  status ride_status NOT NULL DEFAULT 'published',
  total_seats integer NOT NULL DEFAULT 4 CHECK (total_seats BETWEEN 1 AND 8),
  seats_available integer NOT NULL DEFAULT 4 CHECK (seats_available BETWEEN 0 AND 8),
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes_ciphertext bytea,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (seats_available <= total_seats)
);