FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ .

EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5173/ || exit 1

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
