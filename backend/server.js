require("dotenv").config();
const start = require("./src/app");

const PORT = process.env.PORT || 5000;

start().then(app => {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to start server:", err);
});
