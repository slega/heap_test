#!/bin/bash

# Navigate to the backend directory, install dependencies
cd src/heap-backend
npm install

# Start the backend server using concurrently
npx concurrently "node server.js" &

# Navigate back to the src directory, install dependencies
cd ../
npm install

# Start the React app using concurrently
npx concurrently "npm start"
