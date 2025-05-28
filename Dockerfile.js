# Use a lightweight Node.js base image
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of your application code
COPY . .

# Multer creates an 'uploads' directory, ensure permissions are correct if needed (often not an issue for temp files)
# For robustness, ensure this directory exists and is writable.
RUN mkdir -p uploads && chmod 775 uploads

# Expose the port your app listens on
# Cloud Run expects the application to listen on PORT environment variable, which defaults to 8080.
EXPOSE 8080

# Define the command to run your application
CMD ["node", "server.js"]