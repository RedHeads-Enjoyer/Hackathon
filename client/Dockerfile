FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE $CLIENT_PORT

CMD ["npm", "run", "dev"]