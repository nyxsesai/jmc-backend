CREATE TABLE user_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone_lookup_hmac bytea NOT NULL,
  matched_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  contact_name_encrypted bytea,
  relation_degree smallint NOT NULL DEFAULT 1 CHECK (relation_degree IN (1, 2)),
  is_hidden boolean NOT NULL DEFAULT false,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, phone_lookup_hmac),
  CHECK (owner_id <> matched_user_id)
);

CREATE TABLE blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);