FROM node:slim
WORKDIR /app
COPY . /app
ENV CONFIG_FILE=/share/config.json
RUN npm install --production
CMD npm run start
EXPOSE 80