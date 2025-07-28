const userSchema = {
  User: {
    type: "object",
    properties: {
      id: {
        type: "integer",
        example: 1,
      },
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
      active: {
        type: "boolean",
        example: true,
      },
    },
  },
};
module.exports = userSchema;