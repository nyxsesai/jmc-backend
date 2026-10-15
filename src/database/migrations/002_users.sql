-- Enum types (must be created before tables that use them)
CREATE TYPE user_role AS ENUM ('passenger', 'driver');
CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');

-- Users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL UNIQUE,
  phone_e164_encrypted bytea NOT NULL,
  phone_lookup_hmac bytea NOT NULL UNIQUE,
  full_name text,
  email citext,
  avatar_url text,
  home_place_id uuid,
  active_role user_role NOT NULL DEFAULT 'passenger',
  default_role user_role NOT NULL DEFAULT 'passenger',
  last_role_switched_at timestamptz,
  status user_status NOT NULL DEFAULT 'active',
  profile_completed_at timestamptz,
  contacts_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);