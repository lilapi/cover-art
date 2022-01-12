/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: process.env.BUILD_API === "1" ? "api/_build" : "build",
  devServerPort: 8002,
  ignoredRouteFiles: [".*"]
};
