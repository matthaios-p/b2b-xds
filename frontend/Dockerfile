FROM node:18

WORKDIR /app

COPY package*.json ./

RUN rm -f package-lock.json && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --omit=optional && \
    npm install @rollup/rollup-linux-x64-gnu

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
