import dayjs from "dayjs";
import Joi from "joi";

const getRentals = async (req, res, connection) => {
    const { customerId, gameId, limit, offset, order, desc} = req.query;
    const requestQuery = `
        SELECT rentals.*, games.name AS "nameGame", games."categoryId", games.id AS "idGame",
        customers.id AS "idCustomer", customers.name,
        categories.name AS "nameCategory"
        FROM rentals 
        JOIN games
        ON rentals."gameId" = games.id
        JOIN customers
        ON rentals."customerId" = customers.id
        JOIN categories
        ON games."categoryId" = categories.id 
    `;
    const columns = ["customerId", "id", "gameId", "daysRented", "returnDate", "originalPrice", "delayFee"]
    const assortment = "ORDER BY " + (columns.includes(order) ? `"${order}"` : "id")+ (desc ? " DESC" : "")

    try {
        if(limit && offset){
            const limitOffsetResult = customerId ? 
                await connection.query(requestQuery + 
                    `WHERE rentals."customerId" = $1 ${assortment} LIMIT $2 OFFSET $3;`, [customerId, limit, offset]):

                gameId ?
            
                await connection.query(requestQuery + 
                    `WHERE rentals."gameId" = $1 ${assortment} LIMIT $2 OFFSET $3;`, [gameId, limit, offset]):
                await connection.query(requestQuery + 
                    `${assortment} LIMIT $1 OFFSET $2;`, [limit, offset]);

            res.send(limitOffsetResult.rows)
            return;
        }

        if(offset){
            const offsetResult =  customerId ? 
                await connection.query(requestQuery + 
                    `WHERE rentals."customerId" = $1 ${assortment} OFFSET $2;`, [customerId, offset]):
                    
                    gameId ?
                
                    await connection.query(requestQuery + 
                        `WHERE rentals."gameId" = $1 ${assortment} OFFSET $2;`, [gameId,offset]):
                    await connection.query(requestQuery + 
                        `${assortment} LIMIT $1 OFFSET $1;`, [offset]);
    

            res.send(offsetResult.rows)
            return;
        }
        if(limit){
            const limitResult =  customerId ? 
                await connection.query(requestQuery + 
                    `WHERE rentals."customerId" = $1 ${assortment} LIMIT $2;`, [customerId, limit]):
                
                gameId ?

                await connection.query(requestQuery + 
                    `WHERE rentals."gameId" = $1 ${assortment} LIMIT $2;`, [gameId, limit]):
                await connection.query(requestQuery + 
                    `${assortment} LIMIT $1;`, [limit]);

            res.send(limitResult.rows)
            return;
        }
      
      if (customerId) {
        const customer = await connection.query(requestQuery +
            `WHERE rentals."customerId" = $1 ${assortment}`,[customerId]);

        res.send(customer.rows);
        return;
      }
  
      if (gameId) {
        const game = await connection.query(requestQuery +
            `WHERE rentals."gameId" = $1 ${assortment}`,[gameId]);
            
        res.send(game.rows);
        return;
      }
  
      const result = await connection.query(requestQuery + assortment);
      const objectSquema = (rental) => {
          return {id: rental.id,
            customerId: rental.customerId,
            gameId: rental.gameId,
            rentDate: rental.rentDate,
            daysRented: rental.daysRented,
            returnDate: rental.returnDate,
            originalPrice: rental.originalPrice,
            delayFee: rental.delayFee,
            customer: {
              id: rental.idCustomer,
              name: rental.name,
            },
            game: {
              id: rental.idGame,
              name: rental.nameGame,
              categoryId: rental.categoryId,
              categoryName: rental.nameCategory,
            }}
      }

      const squemedResult = result.rows.map((rental) => objectSquema(rental));
      res.send(squemedResult)

    } catch (error) {
      console.log(error);
      res.sendStatus(500);
    }
}

const postRentals = async(req, res, connection) => {
    const {
        customerId,
        gameId,
        daysRented
    } = req.body

    try{
        const daysSquema = Joi.number().min(1).integer().required();

        const requisitionGame = await connection.query('SELECT * FROM games WHERE id = $1;', [gameId])
        const requisitionCustomer = await connection.query('SELECT * FROM customers WHERE id = $1;', [customerId])
        
        if(!requisitionGame.rows.length 
            || !requisitionCustomer.rows.length 
            || daysSquema.validate(Number(daysRented)).error){
            res.sendStatus(400)
            return;
        }

        const{
            pricePerDay
        } = requisitionGame.rows[0];

        const gameStock = Number(requisitionGame.rows[0].stockTotal);
        const rentals = await connection.query('SELECT * FROM rentals WHERE "gameId" = $1;', [gameId]);
        const onGoingRentals = rentals.rows.filter(rental => rental.returnDate === null);

        if(onGoingRentals.length === gameStock){
            res.sendStatus(400)
            return;
        }

        const rentDate = dayjs().format('YYYY-MM-DD');
        const originalPrice = Number(pricePerDay) * Number(daysRented);

        await connection.query(`INSERT INTO rentals 
            ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") 
            VALUES ($1, $2, $3, $4, null, $5, null)`, 
            [customerId, gameId, rentDate, daysRented, originalPrice]);
        
        res.sendStatus(201)
    } catch(error){
        console.log(error);
        res.sendStatus(500);
    }
}

const calcDelayFee = (rentDate, returnDate, daysRented, pricePerDay) => {
    const dateItShouldReturn = Date.parse(dayjs(rentDate).toDate()) + daysRented * 86400000
    const dateItReturned = Date.parse(dayjs(returnDate).toDate())

    const milisecondsPast = dateItReturned - dateItShouldReturn;
    const secondsPast = Math.floor(milisecondsPast/1000);
    const minutesPast = Math.floor(secondsPast/60);
    const hoursPast = Math.floor(minutesPast/60);
    const daysPast = Math.floor(hoursPast/24);

    if(daysPast < 0){
        return 0;
    }

    const delayFee = daysPast * pricePerDay;

    return delayFee
}

const finishRentals = async (req, res, connection) => {
    const { id } = req.params

    try{
        const requiredRent = await connection.query(`
        SELECT * FROM 
        rentals JOIN games 
        ON rentals."gameId"=games.id
        WHERE rentals.id=$1 
        `, [id])
        
        if(!requiredRent.rows.length){
             res.sendStatus(404)
             return;
        } 

        if(requiredRent.rows[0].returnDate){
             res.sendStatus(400)
             return;
        }

        const returnDate = dayjs().format('YYYY-MM-DD');
        const { 
            rentDate,
            daysRented,
            pricePerDay 
        } = requiredRent.rows[0];
        
        const delayFee = calcDelayFee(rentDate,returnDate, daysRented, pricePerDay);
        
        await connection.query(`UPDATE rentals 
             SET "returnDate" = $2, "delayFee" = $3 
             WHERE id = $1;`,
             [id, returnDate, delayFee])
        res.sendStatus(200)

    } catch(error){
        console.log(error);
        res.sendStatus(500)
    }
}

const deleteRentals = async (req, res, connection)=> {
    const { id } = req.params;

    try{
        const requiredRental = await connection.query('SELECT * FROM rentals WHERE id = $1;', [id]);

        if(!requiredRental.rows.length){
            res.sendStatus(404)
            return;
        }
        
        if(requiredRental.rows[0].returnDate){
            res.sendStatus(400)
            return;
        }
    
        await connection.query('DELETE FROM rentals WHERE id = $1;', [id])
        res.sendStatus(200)  

    } catch (error){
        res.sendStatus(500)
    }
}

const rentals = {
    getRentals,
    postRentals,
    finishRentals,
    deleteRentals
}

export default rentals