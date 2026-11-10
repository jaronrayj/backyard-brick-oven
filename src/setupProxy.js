// CRA automatically loads this file during `yarn start` (development only).
// It proxies /api/inquiry to the running Firebase Hosting emulator (port 5050),
// which resolves the rewrite to the sendInquiry Cloud Function emulator.
// This lets the live-reloading dev server on :3000 submit the inquiry form
// exactly like production, without deploying.
//
// Requires the emulator to be running (started together via `yarn dev`).
const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
  app.use(
    "/api/inquiry",
    createProxyMiddleware({
      target: "http://localhost:5050",
      changeOrigin: true,
      // Don't crash the dev server if the emulator isn't up yet; surface a 502.
      onError(err, req, res) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error:
              "Local emulator not reachable on :5050. Is `yarn dev` running?",
          })
        );
      },
    })
  );
};
