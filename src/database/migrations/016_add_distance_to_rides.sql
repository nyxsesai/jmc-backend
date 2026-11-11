-- Migration: Add distance and duration to rides table
ALTER TABLE rides ADD COLUMN distance_km DECIMAL(10,2);
ALTER TABLE rides ADD COLUMN duration_mins INTEGER;