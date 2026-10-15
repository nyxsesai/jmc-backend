CREATE TABLE places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text NOT NULL,
  address_preview text,
  address_encrypted bytea,
  geog geography(Point, 4326) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Wire up the deferred FK from users (users.home_place_id -> places.id)
ALTER TABLE users
  ADD CONSTRAINT users_home_place_fk
  FOREIGN KEY (home_place_id) REFERENCES places(id) ON DELETE SET NULL;