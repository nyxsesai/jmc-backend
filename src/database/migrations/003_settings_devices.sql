CREATE TABLE user_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  background_location_enabled boolean NOT NULL DEFAULT false,
  contact_matching_enabled boolean NOT NULL DEFAULT false,
  push_notifications_enabled boolean NOT NULL DEFAULT false,
  analytics_enabled boolean NOT NULL DEFAULT false,
  allow_passenger_to_add_passengers boolean NOT NULL DEFAULT false,
  friend_of_friends_enabled boolean NOT NULL DEFAULT false,
  language text NOT NULL DEFAULT 'en-US',
  search_radius_meters integer NOT NULL DEFAULT 8047 CHECK (search_radius_meters BETWEEN 400 AND 50000),
  distance_unit text NOT NULL DEFAULT 'mi' CHECK (distance_unit IN ('mi', 'km')),
  driver_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  passenger_preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  driver_price_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  installation_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  fcm_token_encrypted bytea,
  app_version text,
  locale text,
  time_zone text,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, installation_id)
);