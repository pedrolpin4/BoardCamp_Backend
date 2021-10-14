import express from "express"
import cors from "cors"
import pg from 'pg';

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

app.get("/categories", (req, res) => {
    const selectCategories = connection.query('SELECT * FROM categories;')
    selectCategories.then(result => {
        res.send(result.rows)
    })
    selectCategories.catch(err => res.sendStatus(400))
})

app.post("/categories", (req, res) => {
    const categoryName = req.body ? req.body.name : "";
    let categories = [];
    if(categoryName){
        const selectCategories = connection.query('SELECT * FROM categories;')
        selectCategories.then(result => {
            categories = [...result.rows];   
            if(categories.some(cat => cat.name === categoryName)){
                res.sendStatus(409)
                return
            } else {  
                const insertCategory = connection.query('INSERT INTO categories (name) VALUES ($1)', [categoryName])
                insertCategory.then(result => {
                    res.sendStatus(201)
                    return
                })
                insertCategory.catch(err => {
                     res.send(err)
                     return  
                })  
            }
        })
        selectCategories.catch(err => {
            res.send(err) 
            return
        }) 
        console.log(categories);
        
    } else res.sendStatus(400)    
})

app.listen(4000);