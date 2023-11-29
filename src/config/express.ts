import express from "express";

const createServer = (): express.Application => {
  const app = express();

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.disable("x-powered-by");

  app.get("/antica/v1/health", (_req, res) => {
    res.send("ok");
  });

  return app;
};

export { createServer };
