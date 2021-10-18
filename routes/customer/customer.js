import Joi from "joi";

const getCustomers = async (req, res, connection) => {
    const {cpf, limit, offset, order, desc} = req.query;
    let requestQuery = 'SELECT * FROM customers '
    const columns = ["name", "id", "phone", "cpf", "birthday"]
    const assortment = "ORDER BY " + (columns.includes(order) ? `"${order}"` : "id") + (desc ? " DESC" : "")

    try{
       
        if(limit && offset){
            const limitOffsetResult = cpf ? 
                await connection.query(requestQuery + 
                    `WHERE cpf LIKE $1 ${assortment} LIMIT $2 OFFSET $3;`, [Number(cpf)+`%`, limit, offset]):
                await connection.query(requestQuery + 
                    `${assortment} LIMIT $1 OFFSET $2;`, [limit, offset]);

            res.send(limitOffsetResult.rows)
            return;
        }
        if(offset){
            const offsetResult = cpf ? 
                await connection.query(requestQuery + 
                    `WHERE cpf LIKE $1 ${assortment} OFFSET $2;`, [Number(cpf)+`%`, offset]):
                await connection.query(requestQuery + 
                    `${assortment} OFFSET $1;`, [offset]);

            res.send(offsetResult.rows)
            return;
        }

        if(limit){
            const limitResult = cpf ? 
                await connection.query(requestQuery + 
                    `WHERE cpf LIKE $1 ${assortment} LIMIT $2;`, [Number(cpf)+`%`, limit]):
                await connection.query(requestQuery + 
                    `${assortment} LIMIT $1;`, [limit, offset]);

            res.send(limitResult.rows)
            return;
        }

        if (cpf){
            const filteredCustomers = await connection.query(requestQuery + 
                `WHERE cpf LIKE $1 ${assortment};`, [Number(cpf)+`%`]);
            
            res.send(filteredCustomers.rows);
            return;
        }
        
        const customers = await connection.query(requestQuery + assortment + ";");
        res.send(customers.rows);

    } catch(error){
        res.sendStatus(500);
    }
}

const getCustomersById = async (req, res, connection) => {
    const {id} = req.params;
    const customer = await connection.query('SELECT * FROM customers WHERE id = $1;', [id]);
    res.send(customer.rows[0])
}

const customerSquema = Joi.object({
    name: Joi.string().min(1).required(),
    phone: Joi.string().min(10).max(11).required().pattern(/^[0-9]+$/),
    cpf: Joi.string().min(11).max(11).required().pattern(/^[0-9]+$/),
    birthday: Joi.string().required().pattern(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
})

const postCustomers = async (req, res, connection) => {
    try{
        const sentCustomer = req.body;
        const {
            name,
            phone,
            cpf, 
            birthday
        } = sentCustomer


        if(customerSquema.validate(sentCustomer).error){
            res.sendStatus(400)
            return;
        }

        const customersResult = await connection.query('SELECT * FROM customers;');
        const customers = customersResult.rows
        
        if(customers.some(customer => customer.cpf === cpf)){
            res.sendStatus(409)
            return;
        }

        await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4);',
        [name, phone, cpf, birthday])
        res.sendStatus(201)

    } catch (error){
        res.sendStatus(500)
    }
}

const editCustomers = async (req, res, connection) => {
    const { id } = req.params;
    const sentCustomer = req.body;
    const {
        name,
        phone,
        cpf, 
        birthday
    } = sentCustomer

    if(customerSquema.validate(sentCustomer).error){
        res.sendStatus(400)
        return;
    }

    try{
        const customersResult = await connection.query('SELECT * FROM customers;');
        const customers = customersResult.rows
        
        if(customers.some(customer => customer.cpf === cpf)){
            res.sendStatus(409)
            return;
        }

        await connection.query(`UPDATE customers 
            SET name = $1, phone = $2, cpf = $3, birthday = $4 
            WHERE id = $5;`,
            [name, phone, cpf, birthday, id])
        res.sendStatus(201)

    } catch (error){
        res.sendStatus(500)
    }
}

const customers = {
    getCustomers,
    getCustomersById,
    postCustomers,
    editCustomers
}

export default customers