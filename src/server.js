import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { router as healthRouter } from "./routes/health.route.js";
import { router as usersRouter } from "./routes/users.route.js";
import { router as skillsRouter } from "./routes/skills.route.js";
import { router as teamsRouter } from "./routes/teams.route.js";
import { router as userProfileRouter } from "./routes/userProfile.route.js";
import { router as uploadsRouter } from "./routes/uploads.route.js";
import { router as companiesRouter } from "./routes/companies.route.js";
import { router as projectsRouter } from "./routes/projects.route.js";
import { router as matchingRouter } from "./routes/matching.route.js";
import { router as projectApplicationsRouter } from "./routes/projectApplications.route.js";
import { router as teamInvitesRouter } from "./routes/teamInvites.route.js";
import { notFoundHandler, errorHandler } from "./utils/http-errors.js";
const { PORT = 4001 } = process.env;

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
app.use("/companies", companiesRouter);
app.use("/projects", projectsRouter);

// Matching
app.use("/matching", matchingRouter);
app.use("/projects", projectApplicationsRouter);

app.use("/teams", teamInvitesRouter);


app.use(notFoundHandler);
app.use(errorHandler);

app.listen(Number(PORT), () => {
  console.log(`core-api (Express) escuchando en http://localhost:${PORT}`);
});
