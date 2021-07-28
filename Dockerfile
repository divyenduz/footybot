FROM node:16-alpine3.13

RUN mkdir -p /app
WORKDIR /app

# copy source files
COPY . /app

# install dependencies
RUN yarn install && yarn prisma generate && yarn build

EXPOSE 3000
CMD yarn start
