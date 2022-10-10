FROM node:16.17.1-alpine3.16

RUN npm config set fund false
RUN npm install -g npm@8.19.2
RUN mkdir -p /home/node/app && chown -R node:node /home/node/app

USER node
WORKDIR /home/node/app

COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node src ./src

RUN npm install

CMD ["npm", "run-script", "print"]