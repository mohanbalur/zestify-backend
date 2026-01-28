export const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const otpExpiry = () =>
  new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
