# syntax=docker/dockerfile:1
FROM node:14.17.4

WORKDIR /app

COPY ["package.json", "yarn.lock", "./"]
RUN yarn
COPY . .
RUN yarn build
RUN rm -r src
EXPOSE 3000
CMD ["node", "dist/index.js"]
