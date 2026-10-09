# Node.js LTS lightweight image use kar rahe hain
FROM node:18-alpine

# Working directory inside container
WORKDIR /app

# Package files copy karo for caching layer
COPY package*.json ./

# Production dependencies install karo
RUN npm install

# Source code copy karo
COPY . .

# Server port expose karo
EXPOSE 5000

# Server start command
CMD ["node", "src/server.js"]