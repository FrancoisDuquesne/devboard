# -- build stage --
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# -- runtime stage --
FROM node:22-alpine

RUN addgroup -S app && adduser -S app -G app
WORKDIR /app

COPY --from=build --chown=app:app /app/.output .output

USER app
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
