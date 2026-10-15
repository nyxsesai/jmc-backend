CREATE INDEX users_status_idx ON users (status);
CREATE INDEX devices_user_idx ON devices (user_id, revoked_at);
CREATE INDEX user_contacts_owner_idx ON user_contacts (owner_id, relation_degree, is_hidden);
CREATE INDEX user_contacts_matched_user_idx ON user_contacts (matched_user_id);
CREATE INDEX blocks_blocked_idx ON blocks (blocked_id);

CREATE INDEX places_user_idx ON places (user_id);
CREATE INDEX places_geog_gix ON places USING gist (geog);

CREATE INDEX vehicles_user_active_idx ON vehicles (user_id, is_active);

CREATE INDEX rides_driver_departure_idx ON rides (driver_id, departure_at DESC);
CREATE INDEX rides_status_departure_idx ON rides (status, departure_at);
CREATE INDEX rides_origin_gix ON rides USING gist (origin_geog);
CREATE INDEX rides_destination_gix ON rides USING gist (destination_geog);
CREATE INDEX rides_route_gix ON rides USING gist (route_geog);
CREATE INDEX rides_corridor_gix ON rides USING gist (corridor_geog);

CREATE INDEX ride_requests_ride_status_idx ON ride_requests (ride_id, status, created_at DESC);
CREATE INDEX ride_requests_passenger_idx ON ride_requests (passenger_id, created_at DESC);
CREATE UNIQUE INDEX ride_requests_one_pending_per_passenger_idx
  ON ride_requests (ride_id, passenger_id)
  WHERE status = 'pending';

CREATE INDEX ride_passengers_ride_idx ON ride_passengers (ride_id, status);
CREATE INDEX ride_passengers_passenger_idx ON ride_passengers (passenger_id, created_at DESC);

CREATE INDEX ride_location_updates_latest_idx ON ride_location_updates (ride_id, captured_at DESC);
CREATE INDEX ride_location_updates_captured_brin ON ride_location_updates USING brin (captured_at);
CREATE INDEX ride_events_ride_idx ON ride_events (ride_id, created_at DESC);

CREATE INDEX conversations_ride_idx ON conversations (ride_id);
CREATE INDEX conversation_members_user_idx ON conversation_members (user_id, left_at);
CREATE INDEX messages_conversation_created_idx ON messages (conversation_id, created_at DESC);

CREATE INDEX notifications_user_created_idx ON notifications (user_id, created_at DESC);
CREATE INDEX safety_reports_status_idx ON safety_reports (status, created_at DESC);