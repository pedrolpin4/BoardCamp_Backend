import express from "express"
import cors from "cors"
import pg from 'pg';
import Joi from "joi";

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

app.get("/categories", async (req, res) => {
    try{
        const result = await connection.query('SELECT * FROM categories;')
        res.send(result.rows)
    }
    catch(error){
        res.sendStatus(500)
    }
})

app.post("/categories", async (req, res) => {
    const categorySquema = Joi.object({
        name: Joi.string().min(1).required()
    })
    const requestCategory = req.body
    try{
        if(categorySquema.validate(requestCategory).error){
            res.sendStatus(400)
            return;
        } 
        const result = await connection.query('SELECT * FROM categories;')
        const categories = [...result.rows];   
        if(categories.some(cat => cat.name === requestCategory.name)){
            res.sendStatus(409)
            return;
        } 

        await connection.query('INSERT INTO categories (name) VALUES ($1)', [requestCategory.name])
        res.sendStatus(201);

    } catch(error){
        res.sendStatus(500)
    }    
})

app.get("/games", async (req, res) => {
    try{
        const {name} = req.query;
        if (name){
            const filteredGames = await connection.query('SELECT * FROM games WHERE name iLIKE $1;', [name+"%"]);
            res.send(filteredGames.rows);
            return;
        }
        
        const games = await connection.query('SELECT * FROM games;');
        res.send(games.rows);
        
    } catch(error){
        res.sendStatus(500);
    }
})

app.post("/games", async(req, res) => {
    try{
        const {
            name,
            image,
            stockTotal,
            categoryId,
            pricePerDay
        } = req.body;

        const categoriesResult = await connection.query('SELECT * FROM categories;');
        const categories = [...categoriesResult.rows];  
        const requestVerification = Joi.object({
            name: Joi.string().min(1).required(),
            image: Joi.string(),
            stockTotal: Joi.number().integer().required().min(1),
            categoryId: Joi.number(),
            pricePerDay: Joi.number().integer().required().min(1)
        })

        if(requestVerification.validate(req.body).error || categories.every(cat => cat.id !== Number(categoryId))){
            res.sendStatus(400);
            return;
        }    

        const gamesResults = await connection.query('SELECT * FROM games;');
        const games = [...gamesResults.rows]
        if(games.some(game => game.name === name)){
            res.sendStatus(409);
            return;
        }

        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)', 
        [name, image, stockTotal, pricePerDay, categoryId]);
        res.sendStatus(201);

    } catch(error){
        res.sendStatus(500);
    }
})

app.get("/customers", async (req, res) => {
    const {cpf} = req.query;
    try{
        if (cpf){
            const filteredCustomers = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1;', [Number(cpf)+"%"]);
            res.send(filteredCustomers.rows);
            return;
        }

        const customers = await connection.query('SELECT * FROM customers;');
        res.send(customers.rows);

    } catch(error){
        res.sendStatus(500);
    }
})

app.get("/customers/:id", async (req, res) => {
    const {id} = req.params;
    const customer = await connection.query('SELECT * FROM customers WHERE id = $1;', [id]);
    res.send(customer.rows[0])
})



app.post("/customers", async (req, res) => {
    try{
        const sentCustomer = req.body;
        const {
            name,
            phone,
            cpf, 
            birthday
        } = sentCustomer

        const customerSquema = Joi.object({
            name: Joi.string().min(1).required(),
            phone: Joi.string().min(10).max(11).required().pattern(/^[0-9]+$/),
            cpf: Joi.string().min(11).max(11).required().pattern(/^[0-9]+$/),
            birthday: Joi.string().required().pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
        })

        if(customerSquema.validate(sentCustomer).error){
            res.sendStatus(400)
            return;
        }

        const customersResult = await connection.query('SELECT * FROM customers');
        const customers = customersResult.rows
        
        if(customers.some(customer => customer.cpf === cpf)){
            res.sendStatus(409)
            return;
        }

        await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',
        [name, phone, cpf, birthday])
        res.sendStatus(201)

    } catch (error){
        console.log(error);
        res.sendStatus(500)
    }
})

app.put("/customers/:id", async (req, res) => {
    try{
        const { id } = req.params;
        const sentCustomer = req.body;
        const {
            name,
            phone,
            cpf, 
            birthday
        } = sentCustomer

        const customerSquema = Joi.object({
            name: Joi.string().min(1).required(),
            phone: Joi.string().min(10).max(11).required().pattern(/^[0-9]+$/),
            cpf: Joi.string().min(11).max(11).required().pattern(/^[0-9]+$/),
            birthday: Joi.string().required().pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
        })

        if(customerSquema.validate(sentCustomer).error){
            res.sendStatus(400)
            return;
        }

        const customersResult = await connection.query('SELECT * FROM customers');
        const customers = customersResult.rows
        
        if(customers.some(customer => customer.cpf === cpf)){
            res.sendStatus(409)
            return;
        }

        await connection.query('UPDATE customers SET name = $1, phone = $2, cpf = $3, birthday = $4 WHERE id = $5',
        [name, phone, cpf, birthday, id])
        res.sendStatus(201)

    } catch (error){
        console.log(error);
        res.sendStatus(500)
    }
})

app.get("/rentals", async(req,res) => {
    try {
        const { 
            customerId, 
            gameId 
        } = req.query;

        if(customerId){
            const customersRentals = await connection.query('SELECT * FROM rentals WHERE customerId = $1;', [customerId]);
            res.send(customersRentals.rows)
            return;
        }

        if(gameId){
            const gameRentals = await connection.query('SELECT * FROM rentals WHERE gameId = $1;', [gameId]);
            res.send(gameRentals.rows)
            return;
        }

        const rentals = await connection.query('SELECT * FROM rentals;')
        res.send(rentals.rows)

    } catch(error){
        res.sendStatus(500)
    }
})

app.post("/rentals", async(req, res) => {
    try{
        const sentRental = req.body;
        const {
            customerId,
            gameId,
            daysRented
        } = sentRental

    } catch(error){
        res.sendStatus(500);
    }
})

app.delete("/rentals/:id", async (req, res)=> {
    const { id } = req.params;
    const requiredRental = await connection.query('SELECT * FROM rentals WHERE id = $1;', [id])
    if(!requiredRental.rows.length){
        res.sendStatus(404)
    }
    
    if(requiredRental.rows[0].returnDate){
        res.sendStatus(400)
    }

    await connection.query('DELETE FROM rentals WHERE id = $1;', [id])
    res.sendStatus(200)
})



app.listen(4000);