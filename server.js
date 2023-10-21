const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

app.use(bodyParser.json());
app.use(express.static('./build'));
app.set('trust proxy', true)
//const serverless = require('serverless-http');
const session = require('express-session');
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));
const mysql = require('mysql2');
var sql_Connect = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  port: process.env.MYSQLPORT,
  database: process.env.MYSQLDATABASE,

  // 無可用連線時是否等待pool連線釋放(預設為true)
  waitForConnections: true,
  // 連線池可建立的總連線數上限(預設最多為10個連線數)
  connectionLimit: 15
});

// app.use(express.json());
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: './build' });
})


app.post('/api/login', async (req, res) => {
  const { userid, password, recaptcha } = req.body;
  const secretKey = process.env.recaptcha
  console.log(`[USER TRYING LOGIN] /api/login User:${userid} IP:${req.ip}`)

  await fetch(
    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptcha}`
  ).then(gres => gres.json())
    .then(googleRes => {
      if (googleRes.success) {
        sql_Connect.getConnection(function (err, connection) {
          connection.query('SELECT * FROM userData WHERE userid = ? AND userpassword = ?', [userid, password], function (error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
              req.session.loggedin = true;
              req.session.username = results[0].username;
              req.session.userid = results[0].userid
              req.session.role = results[0].role
              console.log(`[USER LOGIN - SUCCESS] /api/login User:${req.session.username} IP:${req.ip}`)
              res.send(JSON.stringify({ message: '登入成功', data: { userid: results[0].userid, username: results[0].username, role: results[0].role }, ok: true }));
            } else {
              req.session.destroy()
              console.log(`[USER LOGIN - ERROR] /api/login IP:${req.ip} reason:incorrect password or id`)
              res.status(401).json({ message: '帳號或密碼錯誤\n如果持續無法登入，請聯絡老師重設密碼', ok: false, code: 401 });
            }
            res.end();
            connection.release();
          })
        })
      } else {
        console.log(`[USER LOGIN - ERROR] /api/login IP:${req.ip} reason:recaptcha`)
        res.status(403).json({ message: 'recaptcha驗證失敗，請重新驗證', ok: false, code: 401 });
      }
    })
});

app.post("/api/getscore", (req, res) => {

  if (req.session.role) {
    sql_Connect.getConnection(function (err, connection) {
      connection.query('SELECT * FROM scoreData WHERE stdId = ? ', [req.session.userid.replace("p", "s")], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {

          res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));
        } else {
          res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
        }

        res.end();
        connection.release();
      })
    })
  } else {
    res.status(403).json({ message: 'Invalid credentials', ok: false, code: 403 });
    res.end();
  }


})

app.post("/api/getallstudents", (req, res) => {
  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query('SELECT id,username,userid,userpassword FROM userData', function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));
        } else {
          res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
        }

        res.end();
        connection.release();
      })
    })
  } else {
    res.status(403).json({ message: 'Invalid credentials', ok: false, code: 403 });
    res.end();
  }
})


app.post("/api/getallstudentsforscore", (req, res) => {
  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query(`SELECT id,username,userid,role FROM userData WHERE role = 'std' `, function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));
        } else {
          res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
        }

        res.end();
        connection.release();
      })
    })
  } else {
    res.status(403).json({ message: 'Invalid credentials', ok: false, code: 403 });
    res.end();
  }
})

app.post("/api/getallstudentscorebyid", (req, res) => {
  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query(`SELECT id,stdId, ? FROM scoreData`, [req.body.uid], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {
          console.log(`[SQL RESULT] /api/getallstudentscorebyid\nUser:${req.session.username}`)
          console.log(results)
          res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));
        } else {
          res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
        }

        res.end();
        connection.release();
      })
    })
  } else {
    res.status(403).json({ message: 'Invalid credentials', code: 403, ok: false });
    res.end();
  }
})

app.post("/api/changepassword/student", (req, res) => {
  // console.log(`[HTTP POST] /api/changepassword/student User:${req.session.username}`)
  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query(`
            UPDATE userData
            SET userpassword = ?
            WHERE id = ?
            `, [req.body.password, req.body.id], function (error, results, fields) {
        if (error) throw error;

        // console.log(`[SQL RESULT] /api/changepassword/student\nUser:${req.session.username}\n`)
        console.log(results)
        res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));

        res.end();

        connection.release();

      })
    })
  } else {
    res.status(403).json({ code: 403, message: 'Invalid credentials', ok: false });
    res.end();
  }
})




app.post("/api/updatescore", (req, res) => {
  console.log(`[HTTP POST] /api/updatescore\nUser:${req.session.username}`)

  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query(`
            UPDATE scoreData
            SET ? = ?
            WHERE id = ?
            `, [req.body.scoreid, req.body.scoreData, req.body.id], function (error, results, fields) {
        if (error) throw error;

        console.log(`[SQL RESULT] /api/updatescore\nRESULT:\nUser:${req.session.username}\n`)
        console.log(results)
        res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));

        res.end();

        connection.release();

      })
    })
  } else {
    res.status(403).json({ code: 403, message: 'Invalid credentials', ok: false });
    res.end();
  }
})




app.post("/api/updatescoresetting", (req, res) => {
  console.log(`[HTTP POST] /api/updatescoresetting User:${req.session.username}`)

  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query(`
            UPDATE scoreUid
            SET scoreName = ?, subject = ?, summery = ?
            WHERE uid = ?
            `, [req.body.title, req.body.tags, req.body.annousment, req.body.scoreid], function (error, results, fields) {
        if (error) throw error;

        console.log(`[SQL RESULT] /api/updatescoresetting\nUser:${req.session.username}\n`)
        console.log(results)
        res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));

        res.end();

        connection.release();

      })
    })
  } else {
    res.status(403).json({ code: 403, message: 'Invalid credentials', ok: false });
    res.end();
  }
})

app.post("/api/deletescore", (req, res) => {
  console.log(`[HTTP POST] /api/deletescore\n${req.body}\nUser:${req.session.username}`)
  if (req.session.role === "teacher") {
    sql_Connect.getConnection(function (err, connection) {
      connection.query(`
            ALTER TABLE scoreData
            DROP COLUMN ?
            ALTER TABLE parentAccountCtrl 
            DROP COLUMN ?
            `, [req.body.scoreid, req.body.scoreid], function (error, results, fields) {
        if (error) throw error;


        console.log(`[SQL RESULT] /api/deletescore\nUser:${req.session.username}\n`)
        console.log(results)

        sql_Connect.getConnection(function (err, connection2) {
          connection2.query(`
            DELETE FROM scoreUid
            WHERE uid = ?
            `, [req.body.scoreid], function (error2, results2, fields) {
            if (error2) throw error2;

            console.log(`[SQL RESULT] /api/deletescore\nUser:${req.session.username}\n`)
            console.log(results2)
            res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));

            res.end();

            connection2.release();

          })
        })

        connection.release();

      })
    })
  } else {
    res.status(403).json({ code: 403, message: 'Invalid credentials', ok: false });
    res.end();
  }
})



app.post("/api/uploadnewscore", (req, res) => {
  if (req.session.role === "teacher") {
    var theUUID = uuidv4().slice(0, 7)
    //create uuid
    //add new column
    //put all data
    if (Number(theUUID) === NaN) {
      theUUID = uuidv4().slice(0, 7)
    }

    sql_Connect.getConnection(function (err, connection) {
      connection.query(`
            INSERT INTO scoreUid (uid,scoreName,scoresetuid,subject,summery,publish)
            VALUES(?,?,?,?,?,?)
            `, [theUUID, req.body.score.title, theUUID, req.body.score.subject, req.body.score.annousment, req.body.method === "publish"], function (error, results, fields) {
        if (error) throw error;

        sql_Connect.getConnection(function (err, connection2) {
          connection2.query(`
                    ALTER TABLE scoreData
                    ADD COLUMN ? TEXT
                    ALTER TABLE parentAccountCtrl
                    ADD COLUMN ? TEXT
                    `, [theUUID, theUUID], function (error, results, fields) {
            if (error) throw error;
            req.body.score.scoreData.forEach((score, i) => {


              console.log("[SQL DATA WRITING]", theUUID, " ", i + 1, " STILL PROCESSING")
              sql_Connect.getConnection(function (err, connection3) {

                var index = i,
                  text = `${req.body.score.scoreData[index] !== null && req.body.score.scoreData[index] ? req.body.score.scoreData[index] : null}%|%${req.body.score.summeryData[index] !== null && req.body.score.summeryData[index] ? req.body.score.summeryData[index] : null}`

                connection3.query(`
                                UPDATE scoreData
                                SET ? = ?
                                WHERE id = ?;
                                `, [theUUID, text, index], function (error, results, fields) {
                  if (error) throw error;
                  console.log("SQL DATA WRITING : ", theUUID, " ", index, " COMPLETE [SUCCESS]")
                  connection3.release();
                })
              })
            })
            connection2.release();
            res.status(200).json({ message: 'ok', ok: true, uuid: theUUID });
          })
        })
        connection.release();
      })
    })

  } else {
    res.status(403).json({ code: 403, message: 'Invalid credentials', ok: false });
    res.end();
  }
})

app.post("/api/getscorebyid", (req, res) => {
  if (req.session.role) {
    sql_Connect.getConnection(function (err, connection) {
      connection.query('SELECT * FROM scoreData WHERE stdId = ? ', [req.session.userid.replace("p", "s")], function (error, results, fields) {
        if (error) throw error;
        if (results.length > 0) {

          //繼續查最高/最低/平均

          sql_Connect.getConnection(function (err, connection2) {
            connection2.query(`SELECT ? FROM scoreData`, [req.body.id], function (error2, results2, fields2) {
              if (error2) {
                res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
              };




              if (results2.length > 0) {
                var hi = 0, lo = 0, avg = 0, tot = 0, scoreList = []

                for (i = 0; i < results2.length; i++) {
                  if (results2[i][req.body.id].split("%|%")[0] !== 'null' && results2[i][req.body.id].split("%|%")[0] !== 'undefined') {
                    tot += Number(results2[i][req.body.id].split("%|%")[0])
                    scoreList.push(Number(results2[i][req.body.id].split("%|%")[0]))
                  }
                }
                hi = Math.max(...scoreList)
                lo = Math.min(...scoreList)

                avg = (tot / scoreList.length).toFixed(2)

                console.log(`[SCORE COUNTING] ${req.body.id} User:${req.session.username}\n${scoreList}\n`)
                res.send(JSON.stringify({ message: 'Login successful', data: { hi: hi, lo: lo, avg: avg, your: results[0][req.body.id].split("%|%")[0], privateMsg: results[0][req.body.id].split("%|%")[1] }, ok: true }));
              } else {
                res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
              }

              res.end();
              connection2.release();
            })
          })

          //    console.log(results)
          //    res.send(JSON.stringify({ message: 'Login successful', data: { result: {yourScore:results[i][req.id],} }, ok: true }));
        } else {
          res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
        }

        ////     res.end();
        connection.release();
      })
    })
  } else {
    res.status(403).json({ code: 403, message: 'Invalid credentials', ok: false });
    res.end();
  }

})

app.post("/api/getscoremap", (req, res) => {
  sql_Connect.getConnection(function (err, connection) {
    connection.query('SELECT * FROM scoreUid', function (error, results, fields) {
      if (error) throw error;
      if (results.length > 0) {

        res.send(JSON.stringify({ message: 'Login successful', data: { result: results }, ok: true }));
      } else {
        res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
      }

      res.end();
      connection.release();
    })
  })
})

app.post("/api/changepass", (req, res) => {
  console.log("[CHANGE PASSWORD] \nUser: ", req.session.username, "\n")
  if (req.session.userid === req.body.userid) {
    //要再檢查一遍舊密碼

    sql_Connect.getConnection(function (err, connection) {
      connection.query(`
    SELECT * FROM userData
    WHERE userid = ?
    `, [req.body.userid], function (error, results, fields) {
        if (error) throw error;
        //   console.log(`[SQL RESULT] /api/changepass\nUser:${req.session.username}`)
        console.log(results)
        if (results[0].userpassword === req.body.oldpass) {


          sql_Connect.getConnection(function (err, connection2) {
            connection2.query(`
          UPDATE userData
          SET userpassword = ?
          WHERE userid = ?
          `, [req.body.newpass, req.body.userid], function (error, results2, fields) {
              if (error) throw error;


              res.send(JSON.stringify({ message: 'Login successful', data: { result: results2 }, ok: true }));


              res.end();
              connection2.release();
            })
          })

        } else {
          res.status(404).json({ message: 'Invalid credentials', ok: false, code: 404 });
        }

        connection.release();
      })
    })




    req.session.destroy()
  } else {
    res.status(403).json({ code: 403, message: 'error 403', ok: false });
    res.end();

  }

})



app.post("/api/checklogin", (req, res) => {
  console.log(`[HTTP POST] /api/checklogin User:${req.session.username} IP:${req.ip}`)

  res.send(JSON.stringify(
    {
      logined: req.session.loggedin,
      data: {
        data: {
          userid: req.session.userid,
          username: req.session.username,
          role: req.session.role
        }
      }
    }))
})

app.post("/api/logout", (req, res) => {
  console.log(`[USER LOGOUT] User:${req.session.username} IP:${req.ip}`)

  req.session.destroy()
  res.send(JSON.stringify({ message: 'logout successful', ok: true }))
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


//module.exports.handler = serverless(app);