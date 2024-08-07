# Use an official Node runtime as a parent image
FROM node:latest

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock/package-lock.json
COPY package*.json ./

# Install dependencies
RUN bun install
# If you're using Yarn, you can use `RUN yarn install`

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port your app runs on
EXPOSE 5500

# Command to run the app
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]