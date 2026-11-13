const point = {
  type: "object",
  required: ["lat", "lng"],
  properties: {
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
  },
};

const idParam = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};

export const createRideSchema = {
  body: {
    type: "object",
    required: ["origin", "destination", "departure_at"],
    properties: {
      origin: point,
      destination: point,
      // optional road route from the maps API, as [[lng, lat], ...]
      route: {
        type: "array",
        minItems: 2,
        maxItems: 5000,
        items: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "number" },
        },
      },
      departure_at: { type: "string", minLength: 10, maxLength: 40 },
      total_seats: { type: "integer", minimum: 1, maximum: 8 },
      vehicle_id: { type: "string", format: "uuid" },
      origin_place_id: { type: "string", format: "uuid" },
      destination_place_id: { type: "string", format: "uuid" },
      preferences: { type: "object" },
      notes: { type: "string", maxLength: 500 },
      distance_km: { type: "number", minimum: 0 },
      duration_mins: { type: "integer", minimum: 0 },
    },
  },
};

export const updateRideSchema = {
  params: idParam,
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      departure_at: { type: "string", minLength: 10, maxLength: 40 },
      total_seats: { type: "integer", minimum: 1, maximum: 8 },
      preferences: { type: "object" },
      notes: { type: "string", maxLength: 500 },
    },
  },
};

export const cancelRideSchema = { params: idParam };

export const listMineSchema = {
  querystring: {
    type: "object",
    properties: {
      scope: {
        type: "string",
        enum: ["upcoming", "past"],
        default: "upcoming",
      },
    },
  },
};

export const searchRidesSchema = {
  querystring: {
    type: "object",
    required: ["pickup_lat", "pickup_lng", "dropoff_lat", "dropoff_lng"],
    properties: {
      pickup_lat: { type: "number", minimum: -90, maximum: 90 },
      pickup_lng: { type: "number", minimum: -180, maximum: 180 },
      dropoff_lat: { type: "number", minimum: -90, maximum: 90 },
      dropoff_lng: { type: "number", minimum: -180, maximum: 180 },
      radius_meters: {
        type: "integer",
        minimum: 100,
        maximum: 10000,
        default: 5000,
      },
    },
  },
};
