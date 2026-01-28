import twilio from "twilio";



const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSms = async (phone, message) => {
  const formattedPhone = phone.startsWith("+")
    ? phone
    : `+91${phone}`;

  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE,
    to: formattedPhone,
  });
};
