import jwt from "jsonwebtoken";

// Same secret and payload shape as your HTTP login token (payload has userId)
export const verifySocketToken = (token) => {
  if (typeof token !== "string" || !token) throw new Error("Missing token");
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload?.userId) throw new Error("Invalid token");
  return payload.userId;
};
