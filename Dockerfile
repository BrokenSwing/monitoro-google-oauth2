FROM node:19-alpine
WORKDIR /usr

COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY index.ts ./

RUN npm install
RUN npm run build

RUN npm install pm2 -g
EXPOSE 80

CMD ["pm2-runtime", "index.js"]