export const success = (data = null, message = "OK") => ({
  success: true,
  message,
  data,
});

export const error = (message, code = null) => ({
  success: false,
  message,
  code,
});
