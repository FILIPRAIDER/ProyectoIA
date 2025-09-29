import "./env.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { router as healthRouter } from "./routes/health.routes.js";
import { router as usersRouter } from "./routes/users.routes.js";
import { router as skillsRouter } from "./routes/skills.routes.js";
import { router as teamsRouter } from "./routes/teams.routes.js";
import { router as userProfileRouter } from "./routes/userProfile.routes.js";
import { router as uploadsRouter } from "./routes/uploads.routes.js";
import { notFoundHandler, errorHandler } from "./utils/http-errors.js";
import { PORT } from "./env.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.use("/health", healthRouter);
app.use("/users", usersRouter);
app.use("/skills", skillsRouter);
app.use("/teams", teamsRouter);
// Montamos también bajo /users (p. ej., /users/:userId/profile)
app.use("/users", userProfileRouter);
app.use("/uploads", uploadsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(Number(PORT), () => {
  console.log(`core-api (Express) escuchando en http://localhost:${PORT}`);
});
