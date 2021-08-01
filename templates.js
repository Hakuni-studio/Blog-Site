const fs = require("fs");
const cookies = require("./cookies");
const files = require("./files");

async function FillPlaceholders(text, req, pageData) {
  let t = new String(text);
  var isLoggedIn = false;
  await cookies
    .CheckSessionCookieValidation(await cookies.GetSessionCookie(req))
    .then((v) => {
      isLoggedIn = v;
    });

  if (isLoggedIn) {
    var userSessionArray = []
    await files.ReadUserSessionFile(req).then(function (v){
      userSessionArray = v;
    });
    t = t.replace(/\$#\[User_Profile_Name\]/g, userSessionArray["username"]);
  }
  t = t.replace(/\$#\[Most_Viewed_Post\]/g, "Most viewed");
  t = t.replace(/\$#\[Latest_Posts\]/g, "Latest posts");
  if (isLoggedIn) {
    t = t.replace(
      /\$#\[Login_Logout_Button\]/g,
      `<a href="http://${req.headers.host}/login/logout">Logout</a>`
    );
  } else {
    t = t.replace(
      /\$#\[Login_Logout_Button\]/g,
      `<a href="http://${req.headers.host}/login">Login</a>`
    );
  }
  t = t.replace(/\$#\[.*/g, "");
  return t;
}

module.exports = { FillPlaceholders };
