# 1. Base image
FROM node:18-alpine

# 2. Create app directory
WORKDIR /app

# 3. Copy package files
COPY package*.json ./

# 4. Install dependencies
RUN npm install

# 5. Copy source code
COPY . .

# 6. Build the project (babel src -> dist)
RUN npm run build

# 7. Expose port (change if your app uses different port)
EXPOSE 3000

# 8. Start the app
CMD ["npm", "start"]
