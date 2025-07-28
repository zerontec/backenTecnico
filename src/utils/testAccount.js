const nodemailer = require("nodemailer");

const createTestAccount = async () => {
  const testAccount = await nodemailer.createTestAccount();
  console.log("Ethereal account created:");
  console.log(`User: ${testAccount.user}`);
  console.log(`Pass: ${testAccount.pass}`);
};

createTestAccount();