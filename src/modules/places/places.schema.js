const idParam = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};

const lat = { type: "number", minimum: -90, maximum: 90 };
const lng = { type: "number", minimum: -180, maximum: 180 };

export const createPlaceSchema = {
  body: {
    type: "object",
    required: ["label", "lat", "lng"],
    properties: {
      label: { type: "string", minLength: 1, maxLength: 60 },
      address_preview: { type: "string", maxLength: 120 }, // short, shown in lists
      address: { type: "string", maxLength: 300 }, // full address, stored encrypted
      lat,
      lng,
    },
  },
};

export const updatePlaceSchema = {
  params: idParam,
  body: {
    type: "object",
    minProperties: 1,
    properties: {
      label: { type: "string", minLength: 1, maxLength: 60 },
      address_preview: { type: "string", maxLength: 120 },
      address: { type: "string", maxLength: 300 },
      lat,
      lng,
    },
  },
};

export const placeIdSchema = { params: idParam };
