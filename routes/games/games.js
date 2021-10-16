import Joi from "joi";

const getGames = async (req, res, connection) => {
    const { name } = req.query;

    try{
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