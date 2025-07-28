const authSchema = {
  Login: {
    type: "object",
    properties: {
      email: {
        type: "string",
        example: "juanperez@gmail.com",
      },
      password: {
        type: "string",
        example: "123456",
      },
    },
  },
  Register: {
    type: "object",
    properties: {
      name: {
        type: "string",
        example: "Juan Perez",
      },
      email: {
        type: "string",
        example: "juanperez@gmail.com",
      },
      password: {
        type: "string",
        example: "123456",
      },
      role: {
        type: "string",
        example: "user",
      },
    },
  },
  Recovery: {
    type: "object",
    properties: {
      email: {
        type: "string",
        example: "juanperez@gmail.com",
      },
    },
  },
  Reset: {
    type: "object",
    properties: {
      token: {
        type: "string",
        example: "1234567890abcdef",
      },
      newPassword: {
        type: "string",
        example: "123456",
      },
    },
  },
};
module.exports = authSchema;