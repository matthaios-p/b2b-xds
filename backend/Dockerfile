FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm install nodemon --save-dev

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
