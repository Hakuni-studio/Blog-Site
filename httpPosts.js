const mysql = require("./mysql");
const fs = require("fs");
const files = require("./files");
const cookies = require("./cookies");

async function CreateSessionID(data) {
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789&-_";
  for (let i = 0; i < characters.length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  console.log(result);
  fs.readdir("./userSessions", (err, files) => {
    if (err) {
      console.log(err);
      return;
    }
    if (files.includes(result)) {
      CreateSessionID(data);
    }
  });
  fs.writeFile(
    `./userSessions/${result}`,
    JSON.stringify(data),
    "utf-8",
    (err) => {
      if (err) return console.log(err);
    }
  );
  return result;
}

async function LoginUser(req, res, data) {
  const sessId = await CreateSessionID(data);
  res.writeHead(302, {
    "Set-Cookie": `${process.env.SESSION_COOKIE_NAME}=${sessId};path=/`,
    Location: `http://${req.headers.host}/`,
  });
  res.end();
}

async function HandlePost(req, res) {
  // Get modify the path
  const path = req.url.toLowerCase().split("/");

  // Get the data sent in the POST
  var body = "";
  req.on("data", function (data) {
    body += data;
  });

  // When the post is done sending data
  req.on("end", async function () {
    // Get all data sent
    const bodySplit = body.replace(/%40/g, "@").split("&");
    // Get all cookies
    const cookiesJson = JSON.parse(JSON.stringify(cookies.ParseCookies(req)));
    // Get session cookie
    const sessionCookie = cookiesJson[process.env.SESSION_COOKIE_NAME];

    // Variable to hold if the user has a valid session
    var sessionFoundAndRedirected = false;
    console.log(bodySplit);
    switch (bodySplit[bodySplit.length - 1].split("=")[0]) {
      case "login_btn":
        if (sessionCookie) {
          await cookies
            .CheckSessionCookieValidation(sessionCookie)
            .then(function (v) {
              sessionFoundAndRedirected = v;
            });
          if (sessionFoundAndRedirected) {
            res.writeHead(302, {
              Location: `http://${req.headers.host}/`,
            });
            res.end();
            return;
          }
        }
        const username = bodySplit[0].split("=")[1];
        const password = bodySplit[1].split("=")[1];

        await mysql
          .ExecuteSQL(
            `SELECT id, username, email FROM users WHERE email = '${username}' AND password = '${password}'`
          )
          .then(async (result) => {
            if (!result) {
              const file = await files.GetCorrectFile(req.url);
              res.writeHead(200, {
                "Content-Type": `${files.GetContentType(
                  req.url
                )};charset=UTF-8`,
              });
              fs.readFile(`./public_html${file}`, "utf8", async (err, data) => {
                res.end(
                  data.replace(
                    /\$#\[Err_Msg\]/g,
                    `<span style="color:red;"><p id="errorBox">Wrong email or password!</p></span>`
                  )
                );
                return;
              });
              return;
            }
            LoginUser(req, res, {
              id: result.id,
              username: result.username,
              email: result.email,
            });
          }).catch(async (e) => {
            console.log(e);
            return;
          })

        mysql.ExecuteSQL(
          `SELECT id, username, email FROM users WHERE email = '${username}' AND password = '${password}'`,
          async function (err, result) {
            if (err) {
              console.log(err);
              return;
            }
            if (!result) {
              const file = await files.GetCorrectFile(req.url);
              res.writeHead(200, {
                "Content-Type": `${files.GetContentType(
                  req.url
                )};charset=UTF-8`,
              });
              fs.readFile(`./public_html${file}`, "utf8", async (err, data) => {
                res.end(
                  data.replace(
                    /\$#\[Err_Msg\]/g,
                    `<span style="color:red;"><p id="errorBox">Wrong email or password!</p></span>`
                  )
                );
                return;
              });
              return;
            }
          }
        );
        break;
      case "register_btn":
        if (sessionCookie) {
          await cookies
            .CheckSessionCookieValidation(sessionCookie)
            .then(function (v) {
              sessionFoundAndRedirected = v;
            });
          if (sessionFoundAndRedirected) {
            res.writeHead(302, {
              Location: `http://${req.headers.host}/`,
            });
            res.end();
            return;
          }
        }
        await mysql.ExecuteSQL(
          `INSERT INTO users(username, email, password, salt) VALUES('${
            bodySplit[0].split("=")[1]
          }','${bodySplit[1].split("=")[1]}','${
            bodySplit[2].split("=")[1]
          }','salting')`
        );
        res.writeHead(302, {
          Location: `http://${req.headers.host}/`,
        });
        res.end();
        break;
      default:
        break;
    }
  });
}
module.exports = { HandlePost };
