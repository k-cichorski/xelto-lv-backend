const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    parseJSON: true,
}

const handleError = (err, res) => {
    switch (err.name){
        case 'ConnectionError':
            res.status(408).json('Błąd połączenia z bazą danych. Upewnij się, że masz połączenie z siecią VPN.');
            return
        case 'RequestError':
            res.status(408).json('Wysyłanie żądania zajęło zbyt długo.');
            return
        default:
            res.status(500).json(err.message);
            return
    }

}

// config
const app = express();
const port = process.env.PORT;

// middleware
app.use(express.json());
app.use(cors());

// routes
app.post('/api/v1/getData', (req, res) => {
    const {dateFrom, dateTo, user, status} = req.body;
    try {
        sql.connect(dbConfig, (err) => {
            if (err) {
                handleError(err, res);
            }
            else {
                try {
                    let request = new sql.Request();
                    let sqlQuery = [];
                    if(dateFrom) {
                        sqlQuery.push(`[AuditDate] >= '${dateFrom}'`);
                    }
                    if(dateTo) {
                        sqlQuery.push(`[AuditDate] <= '${dateTo}'`);
                    }
                    if(user) {
                        sqlQuery.push(`[MobileUserId] = '${user}'`);
                    }
                    if(status) {
                        sqlQuery.push(`[Status] = '${status}'`);
                    }
                    let query = '';
                    (!dateFrom && !dateTo && !user && !status)? query = 'select * from LogHeader for json auto;'
                        :
                            query = `select * from LogHeader where ${sqlQuery.join(' AND ')} for json auto;`;

                    request.query(query, (err, recordset) => {
                        if (err) {
                            handleError(err, res);
                        }
                        else {
                            try{
                                let data = recordset.recordsets[0][0];
                                res.type('application/json');
                                res.status(200).json(data);
                            } catch(err){handleError(err, res)}
                        }
                    })
                } catch(err){handleError(err, res)}
                
            }
        })
    } catch(err) {handleError(err, res)}
    
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
