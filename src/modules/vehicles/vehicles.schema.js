const idParam = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", format: "uuid" } },
};

const fields = {
  label: { type: "string", maxLength: 60 },
  make: { type: "string", minLength: 1, maxLength: 40 },
  model: { type: "string", minLength: 1, maxLength: 40 },
  color: { type: "string", maxLength: 30 },
  plate: { type: "string", minLength: 4, maxLength: 15 },
  total_seats: { type: "integer", minimum: 1, maximum: 8 },
};

export const createVehicleSchema = {
  body: { type: "object", required: ["make", "model"], properties: fields },
};

export const updateVehicleSchema = {
  params: idParam,
  body: {
    type: "object",
    minProperties: 1,
    properties: { ...fields, is_active: { type: "boolean" } },
  },
};

export const vehicleIdSchema = { params: idParam };
