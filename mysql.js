require("dotenv").config();
const mysql = require("mysql");

const mysqlPool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DB,
});

async function ExecuteSQL(sql) {
  return new Promise(async (OK, ERR) => {
    mysqlPool.query(sql, async (err, result) => {
      if (err) {
        ERR(err);
        return;
      }
      OK(result[0]);
    });
  });
}

async function GetLatestPosts(userId) {
  mysqlPool.query(
    `SELECT * FROM posts WHERE user = '${userId}' ORDER BY asc LIMIT 10`,
    (err, result) => {
      if (err) {
        console.log(err);
        return err;
      }
      return result;
    }
  );
}

module.exports = {
  GetLatestPosts,
  ExecuteSQL,
};
