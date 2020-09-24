const express = require('express');
const sql = require('mssql');
const dbConfig = require('./dbConfig');
const cors = require('cors');

// config
const app = express();
const port = process.env.PORT || 9000;

// middleware
app.use(express.json());
app.use(cors());

// routes
app.post('/api/v1/getData', (req, res) => {
    const {dateFrom, dateTo, user, status} = req.body;
    try {
        sql.connect(dbConfig, (err) => {
            if (err) {throw err}
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
                    let query = `selecty * from LogHeader where ${sqlQuery.join(' AND ')} for json auto;`;
                    request.query(query, (err, recordset) => {
                        if (err) {throw err}
                        else {
                            try{
                                let data = recordset.recordsets[0][0];
                                res.type('application/json');
                                res.status(200).json(data);
                            } catch(err){res.status(500).send(err);}
                        }
                    })
                } catch(err){res.status(500).send(err)}
                
            }
        })
    } catch(err) {res.status(500).send(err)}
    
});

app.listen(port, () => console.log(`Listening on port: ${port}`));
