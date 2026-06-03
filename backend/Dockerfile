FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY shared/package.json shared/

RUN yarn install --frozen-lockfile

COPY . .

WORKDIR /app/backend
RUN yarn build

EXPOSE 4000
CMD ["node", "dist/src/main.js"]
