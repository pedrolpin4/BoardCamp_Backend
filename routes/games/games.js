import Joi from "joi";

const getGames = async (req, res, connection) => {
    const { name, limit, offset } = req.query;

    try{
        const requestQuery = 'SELECT * FROM games '
        
        if(limit && offset){
            const limitOffsetResult = name ? 
                await connection.query(requestQuery + 
                    "WHERE name iLIKE $1 ORDER BY id LIMIT $2 OFFSET $3;", [name+"%",limit, offset]):
                await connection.query(requestQuery + 
                    "ORDER BY id LIMIT $1 OFFSET $2;", [limit, offset]);

            res.send(limitOffsetResult.rows)
            return;
        }

        if(offset){
            const offsetResult =  name ? 
                await connection.query(requestQuery + 
                    "WHERE name iLIKE $1 ORDER BY id OFFSET $2;", [name+"%", offset]):
                await connection.query(requestQuery + 
                    "ORDER BY id OFFSET $1;", [offset]);

            res.send(offsetResult.rows)
            return;
        }
        if(limit){
            const limitResult =  name ? 
                await connection.query(requestQuery + 
                    "WHERE name iLIKE $1 ORDER BY id LIMIT $2;", [name+"%",limit]):
                await connection.query(requestQuery + 
                    "ORDER BY id LIMIT $1 OFFSET $1;", [limit]);

            res.send(limitResult.rows)
            return;
        }

        if (name){
            const filteredGames = await connection.query(requestQuery + 
                'WHERE name iLIKE $1 ORDER BY id;', [name+"%"]);
            
            res.send(filteredGames.rows);
            return;
        }

        const games = await connection.query(requestQuery + ";");
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
        const categoriesResult = await connection.query('SELECT * FROM categories;');
        const categories = [...categoriesResult.rows];  
        const requestVerification = Joi.object({
            name: Joi.string().min(1).required(),
            image: Joi.string().uri(),
            stockTotal: Joi.number().integer().required().min(1),
            categoryId: Joi.number(),
            pricePerDay: Joi.number().integer().required().min(1)
        })

        if(requestVerification.validate(req.body).error || categories.every(cat => cat.id !== Number(categoryId))){
            res.sendStatus(400);
            console.log(requestVerification.validate(req.body).error);
            return;
        }    

        const gamesResults = await connection.query('SELECT * FROM games;');
        const games = [...gamesResults.rows]
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
        res.sendStatus(500);
    }
}

const games = {
    getGames,
    postGames
}

export default games