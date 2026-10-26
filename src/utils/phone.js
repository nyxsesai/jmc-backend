import { parsePhoneNumberFromString } from "libphonenumber-js";

// Returns E.164 (+919876543210) or null if the number is invalid
export const normalizePhone = (raw, defaultCountry = "IN") => {
  if (!raw || typeof raw !== "string") return null;
  const parsed = parsePhoneNumberFromString(raw.trim(), defaultCountry);
  return parsed && parsed.isValid() ? parsed.number : null;
};
