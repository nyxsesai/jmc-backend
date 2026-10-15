// Firebase-based verify (used when Firebase is enabled)
export const verifyOtpFirebaseSchema = {
  body: {
    type: "object",
    required: ["idToken"],
    properties: {
      idToken: { type: "string", minLength: 20 },
    },
  },
};

// export const sendOtpSchema = {
//   body: {
//     type: "object",
//     required: ["phone"],
//     properties: {
//       phone: { type: "string", minLength: 10, maxLength: 20 },
//     },
//   },
// };

// export const verifyOtpSchema = {
//   body: {
//     type: "object",
//     required: ["phone", "otp"],
//     properties: {
//       phone: { type: "string", minLength: 10, maxLength: 20 },
//       otp: { type: "string", minLength: 4, maxLength: 8 },
//     },
//   },
// };

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
