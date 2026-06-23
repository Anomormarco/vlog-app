FROM node:24-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS api

WORKDIR /app

COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npx prisma generate

COPY src ./src
COPY scripts ./scripts
COPY package*.json ./

ENV NODE_ENV=production

CMD ["node", "src/services/gateway-server.js"]

FROM deps AS client-build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3003/api
ENV VITE_API_URL=${VITE_API_URL}

COPY client ./client
COPY vite.config.js ./

RUN npm run build:client

FROM nginx:1.27-alpine AS client

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=client-build /app/dist/client /usr/share/nginx/html

EXPOSE 80
