CREATE TYPE safety_report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

CREATE TABLE safety_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ride_id uuid REFERENCES rides(id) ON DELETE SET NULL,
  category text NOT NULL,
  description_ciphertext bytea,
  status safety_report_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);