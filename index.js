import express from "express";
import cors from "cors";
import pg from 'pg';
import categories from "./routes/categories/categories.js";
import games from "./routes/games/games.js";
import customers from "./routes/customer/customer.js";
import rentals from "./routes/rentals/rentals.js";

const app = express();
const { Pool } = pg;
app.use(cors());
app.use(express.json());

const connection = new Pool ({ 
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
});

app.get("/categories", (req, res) => categories.getCategories(req, res, connection))

app.post("/categories", (req, res) => categories.postCategories(req, res, connection))

app.get("/games", (req, res) => games.getGames(req, res, connection))

app.post("/games", (req, res) => games.postGames(req, res, connection))

app.get("/customers", (req, res) => customers.getCustomers(req, res, connection))

app.get("/customers/:id", (req, res) => customers.getCustomersById(req, res, connection))

app.post("/customers", (req, res) => customers.postCustomers(req, res, connection))

app.put("/customers/:id", (req, res) => customers.editCustomers(req, res, connection))

app.get("/rentals", (req, res) => rentals.getRentals(req, res, connection));

app.get("/rentals/metrics", (req, res) => rentals.financialStats(req, res, connection))

app.post("/rentals", (req, res) => rentals.postRentals(req, res, connection))

app.post("/rentals/:id/return", (req, res) => rentals.finishRentals(req, res, connection))

app.delete("/rentals/:id", (req, res) => rentals.deleteRentals(req, res, connection))

app.listen(4000);