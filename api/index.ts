/// <reference types="node" />
// Vercel entry point: serves the exported Expo web app and its API routes.
// See https://docs.expo.dev/router/web/api-routes/#vercel
const { createRequestHandler } = require('expo-server/adapter/vercel');

module.exports = createRequestHandler({
  build: require('path').join(__dirname, '../dist/server'),
});
