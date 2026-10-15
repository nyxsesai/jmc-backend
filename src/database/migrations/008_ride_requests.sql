CREATE TYPE ride_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'expired');

CREATE TABLE ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  dropoff_place_id uuid REFERENCES places(id) ON DELETE SET NULL,
  pickup_geog geography(Point, 4326) NOT NULL,
  dropoff_geog geography(Point, 4326) NOT NULL,
  seats_requested integer NOT NULL DEFAULT 1 CHECK (seats_requested BETWEEN 1 AND 6),
  message_ciphertext bytea,
  call_back_requested boolean NOT NULL DEFAULT false,
  status ride_request_status NOT NULL DEFAULT 'pending',
  responded_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (passenger_id IS NOT NULL)
);