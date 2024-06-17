# Stage 1: Build
FROM node:20 as builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json, yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the TypeScript source files
COPY src ./src
COPY tsconfig.json ./

# Transpile TypeScript to JavaScript
RUN yarn build

# Stage 2: Final
FROM node:20-slim

# Set the working directory in the container
WORKDIR /app

# Copy package.json, yarn.lock
COPY package.json yarn.lock ./

# Install production dependencies only
RUN yarn install --production

# Copy the transpiled JavaScript from the builder stage
COPY --from=builder /app/dist ./dist

# Set the command to start the node server
CMD ["node", "dist/index.js"]
