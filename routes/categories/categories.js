import Joi from "joi";

const getCategories = async (req, res, connection) => {
    try{
        const result = await connection.query('SELECT * FROM categories;')
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