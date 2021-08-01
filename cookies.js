require("dotenv").config();
const fs = require("fs");
function ParseCookies(req) {
  var list = {},
    rc = req.headers.cookie;

  rc &&
    rc.split(";").forEach(function (cookie) {
      var parts = cookie.split("=");
      list[parts.shift().trim()] = decodeURI(parts.join("="));
    });

  return list;
}
async function GetSessionCookie(req) {
  // Get all cookies
  const cookiesJson = JSON.parse(JSON.stringify(ParseCookies(req)));
  // Get only sessions cookie from the user
  return cookiesJson[process.env.SESSION_COOKIE_NAME];
}
async function CheckSessionCookieValidation(session) {
  return new Promise(async (OK, ERR) => {
    fs.readdir("./userSessions", function (err, files) {
      if (files.includes(session)) {
        //
        OK(true);
        return;
      }
      OK(false);
    });
  });
}
async function DeleteSession(req, res) {
  const sessionCookie = await GetSessionCookie(req);
  await CheckSessionCookieValidation(sessionCookie).then((v) => {
    if (v) {
      fs.unlink(`./userSessions/${sessionCookie}`, (err) => {
        if (err) {
          console.log(err);
          return;
        }
        res.writeHead(302, {
          "Set-Cookie": `${
            process.env.SESSION_COOKIE_NAME
          }=;path=/;expires=${Date.now()};maxAge=0`,
          Location: `http://${req.headers.host}/`,
        });
        res.end();
        return;
      });
    }
    return;
  });
}
module.exports = {
  ParseCookies,
  CheckSessionCookieValidation,
  DeleteSession,
  GetSessionCookie,
};
