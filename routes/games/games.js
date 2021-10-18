import Joi from "joi";

const getGames = async (req, res, connection) => {
    const { name, limit, offset, order, desc } = req.query;
    const requestQuery = `SELECT games.*, categories.name AS "categoryName" 
    FROM games JOIN categories 
    ON categories.id = games."categoryId" `;
    const columns = ["categoryId", "id", "pricePerDay", "name", "image", "stockTotal"]
    const assortment = "ORDER BY " + (columns.includes(order) ? `"${order}"` : "id")+ (desc ? " DESC" : "")

    try{
        
        if(limit && offset){
            const limitOffsetResult = name ? 
                await connection.query(requestQuery + 
                    `WHERE name iLIKE $1 ${assortment} LIMIT $2 OFFSET $3;`, [name+"%",limit, offset]):
                await connection.query(requestQuery + 
                    `${assortment} LIMIT $1 OFFSET $2;`, [limit, offset]);

            res.send(limitOffsetResult.rows)
            return;
        }

        if(offset){
            const offsetResult =  name ? 
                await connection.query(requestQuery + 
                    `WHERE name iLIKE $1 ${assortment} OFFSET $2;`, [name+"%", offset]):
                await connection.query(requestQuery + 
                    `${assortment} OFFSET $1;`, [offset]);

            res.send(offsetResult.rows)
            return;
        }
        if(limit){
            const limitResult =  name ? 
                await connection.query(requestQuery + 
                    `WHERE name iLIKE $1 ${assortment} LIMIT $2;`, [name+"%",limit]):
                await connection.query(requestQuery + 
                    `${assortment} LIMIT $1 OFFSET $1;`, [limit]);

            res.send(limitResult.rows)
            return;
        }

        if (name){
            const filteredGames = await connection.query(requestQuery + 
                `WHERE name iLIKE $1 ${assortment};`, [name+"%"]);
            
            res.send(filteredGames.rows);
            return;
        }

        const games = await connection.query(requestQuery + assortment + ";");
        res.send(games.rows);   
    } catch(error){
        res.sendStatus(500);
    }
}

const postGames = async(req, res, connection) => {
    const {
        name,
        image,
        stockTotal,
        categoryId,
        pricePerDay
    } = req.body;

    try{
        const gamesResult = await connection.query(`SELECT games.*, categories.name AS "categoryName" 
        FROM games JOIN categories 
        ON categories.id = games."categoryId";`);
        const games = [...gamesResult.rows];  
        const requestVerification = Joi.object({
            name: Joi.string().min(1).required(),
            image: Joi.string().uri(),
            stockTotal: Joi.number().integer().required().min(1),
            categoryId: Joi.number(),
            pricePerDay: Joi.number().integer().required().min(1)
        })
        console.log(games)

        if(requestVerification.validate(req.body).error || games.every(cat => cat.categoryId !== Number(categoryId))){
            res.sendStatus(400);
            return;
        }    

        if(games.some(game => game.name.toUpperCase() === name.toUpperCase())){
            res.sendStatus(409);
            return;
        }

        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5);', 
        [
            name,
            image,
            stockTotal,
            categoryId, 
            pricePerDay
        ]);
        res.sendStatus(201);

    } catch(error){
        console.log(error)
        res.sendStatus(500);
    }
}

const games = {
    getGames,
    postGames
}

export default games