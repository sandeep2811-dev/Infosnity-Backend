// import pkg from "pg";
// import 'dotenv/config';
// const { Pool } = pkg;

// // Use the full connection string from Neon/Render
// // If DATABASE_URL isn't found, it will look for your local password as a backup
// const connectionString = process.env.DATABASE_URL;

// const db = new Pool({
//     connectionString: connectionString,
//     ssl: {
//         // This is REQUIRED for Neon and other cloud providers
//         rejectUnauthorized: false 
//     }
// });

// // Test the connection immediately when the server starts
// db.connect((err) => {
//     if (err) {
//         console.error("❌ Database connection error:", err.stack);
//     } else {
//         console.log("✅ Connected to the Cloud Database successfully.");
//     }
// });

// export default db;
import pkg from "pg";
import "dotenv/config";

const { Pool } = pkg;

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test database connection
(async () => {
  try {
    await db.query("SELECT NOW()");
    console.log("✅ Connected to the Cloud Database successfully.");
  } catch (err) {
    console.error("❌ Database connection error:", err);
  }
})();

// Handle unexpected pool errors
db.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});

export default db;
