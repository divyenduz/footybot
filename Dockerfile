FROM node:12.18.4
WORKDIR /app
ADD . .
RUN yarn
RUN yarn build
RUN yarn prisma generate
USER node
EXPOSE 3000
CMD [ "yarn", "offline" ]
