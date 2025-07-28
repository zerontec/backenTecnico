
FROM node:20

# ENV DOCKER_ENV=true

WORKDIR /app



COPY package*.json ./

RUN npm install


COPY . .

RUN touch .env
EXPOSE 5000


CMD ["node", "index.js"]
