import pkg from "pg";
import 'dotenv/config';
const { Pool } = pkg;
const PASSWORD = process.env.password;
const host = process.env.host;
const port = process.env.port;
const database = process.env.database;
const db= new Pool({
    user: 'postgres',
    host: host,
    database: database,
    password: PASSWORD,
    port: port,
})

export default db;
