const express = require("express");
require("dotenv/config");
const helmet = require("helmet");
const morgan = require("morgan");
const cors = require("cors");
const userRoutes = require("./routes/UserRoutes");
const packageRoutes = require("./routes/PackageRoutes");
const articleRoutes = require("./routes/ArticleRoutes");
const wishlistRoutes = require("./routes/WishlistRoutes");
const bookingRoutes = require("./routes/BookingRoutes");
const reviewRoutes = require("./routes/ReviewRoutes");
const paymentRoutes = require("./routes/PaymentRoutes");
const adminRoutes = require("./routes/AdminRoutes");
const komunitasRoutes = require("./routes/KomunitasRoutes");
const { handleMulterError } = require("./middlewares/upload");
const { swaggerUi, specs } = require("./config/swegger");
const pool = require("./config/db");
const serverless = require("serverless-http");

const app = express();
const port = process.env.PORT || 3000;

// app.use(helmet())
// app.use(cors({
//   origin: "*",
//   methods: "GET,POST,PUT,DELETE,OPTIONS",
//   allowedHeaders: "Content-Type, Authorization"
// }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/user", userRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/articles", articleRoutes);
app.use("/api/wishlists", wishlistRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/komunitas", komunitasRoutes);

app.use(handleMulterError);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get("/api-docs", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Swagger UI</title>
        <link rel="stylesheet" href="./swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="./swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            SwaggerUIBundle({
              url: "/api-docs.json",
              dom_id: "#swagger-ui"
            });
          };
        </script>
      </body>
    </html>
  `);
});

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(specs);
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Muslimah Travel API",
    documentation: "/api-docs",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "disconnected",
  };

  try {
    await pool.query("SELECT 1");
    healthCheck.database = "connected";
    healthCheck.status = "OK";
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.database = "error";
    healthCheck.status = "DEGRADED";
    healthCheck.error = process.env.NODE_ENV === "development" ? error.message : "Database connection failed";
    res.status(503).json(healthCheck);
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || "Internal server error";

  const response = {
    success: false,
    message: message,
  };
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

// app.listen(port, () => {
//     console.log(`Server running at: http://localhost:${port}`)
//     console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
//     console.log(`Documentation: http://localhost:${port}/api-docs`)
// })

module.exports = app;
module.exports.handler = serverless(app);

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT", err);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED", err);
});
