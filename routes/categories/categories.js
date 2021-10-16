import Joi from "joi";

const getCategories = async (req, res, connection) => {
    const { limit, offset } = req.query
    try{
        const requestQuery = 'SELECT * FROM categories ORDER BY id '
        if(limit && offset){
            const limitOffsetResult = await connection.query(requestQuery + 
                "LIMIT $1 OFFSET $2;", [limit, offset])
            res.send(limitOffsetResult.rows)
            return;
        }
        if(offset){
            const offsetResult = await connection.query(requestQuery + 
                "OFFSET $1;", [offset])
            res.send(offsetResult.rows)
            return;
        }
        if(limit){
            const limitResult = await connection.query(requestQuery + 
                "LIMIT $1;", [limit])
            res.send(limitResult.rows)
            return;
        }
       
        const result = await connection.query(requestQuery + ";")
        res.send(result.rows)
    }
    catch(error){
        console.log(error);
        res.sendStatus(500)
    }
}

const postCategories = async (req, res, connection) => {
    const categorySquema = Joi.object({
        name: Joi.string().min(1).required()
    })

    const requestCategory = req.body

    if(categorySquema.validate(requestCategory).error){
        res.sendStatus(400)
        return;
    } 
    try{
        const result = await connection.query('SELECT * FROM categories;')
        const categories = [...result.rows];   
        if(categories.some(cat => cat.name === requestCategory.name)){
            res.sendStatus(409)
            return;
        } 

        await connection.query('INSERT INTO categories (name) VALUES ($1);', [requestCategory.name])
        res.sendStatus(201);

    } catch(error){
        res.sendStatus(500)
    }    
}

const categories = {
    postCategories,
    getCategories
}

export default categories