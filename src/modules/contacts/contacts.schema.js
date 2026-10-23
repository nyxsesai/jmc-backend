export const syncSchema = {
  body: {
    type: "object",
    required: ["phones"],
    properties: {
      phones: {
        type: "array",
        maxItems: 500,
        items: { type: "string", maxLength: 32 },
      },
    },
  },
};

export const hideSchema = {
  params: {
    type: "object",
    required: ["userId"],
    properties: { userId: { type: "string", format: "uuid" } },
  },
  body: {
    type: "object",
    required: ["hidden"],
    properties: { hidden: { type: "boolean" } },
  },
};
