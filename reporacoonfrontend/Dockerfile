FROM node:24-alpine

# Set the working directory
WORKDIR /src

COPY package*.json ./

# Install the dependencies into the image and run app
RUN npm install

# Copy the source code into the image
COPY . .

EXPOSE 3000 

# Run the start command inside the image
CMD [ "npm", "run", "dev" ]