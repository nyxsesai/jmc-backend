export const verifyOtpFirebaseSchema = {
  body: {
    type: "object",
    required: ["idToken"],
    properties: {
      idToken: { type: "string", minLength: 20 },
    },
  },
};

export const registerSchema = {
  body: {
    type: "object",
    required: ["full_name", "email"],
    properties: {
      full_name: { type: "string", minLength: 1, maxLength: 120 },
      email: { type: "string", format: "email", maxLength: 160 },
    },
  },
};

export const switchRoleSchema = {
  body: {
    type: "object",
    required: ["role"],
    properties: {
      role: { type: "string", enum: ["passenger", "driver"] },
    },
  },
};
