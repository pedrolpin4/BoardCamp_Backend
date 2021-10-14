import express from "express"
import cors from "cors"
import pg from 'pg';

const app = express();
const { Pool } = pg;


const connection = new Pool ({ 
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
});
const query = q => connection.query(q);

app.get("/categories", (req, res) => {
    query('SELECT * FROM categories;')
        .then(res => {
            res.send(res)
        })
    res.sendStatus(400)
})

app.use(cors());
app.use(express.json());

app.listen(4000);