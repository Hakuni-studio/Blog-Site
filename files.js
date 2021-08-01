const cookies = require("./cookies");
const fs = require("fs");

var GetContentType = async function (fileName) {
  return fileName.endsWith(".css")
    ? "text/css"
    : fileName.endsWith(".js")
    ? "text/javascript"
    : "text/html";
};

var GetCorrectFile = async function (filePath) {
  return filePath.includes(".") ? filePath : `${filePath}/index.html`;
};

async function ReadUserSessionFile(req) {
  var sessionCookie = null;
  await cookies.GetSessionCookie(req).then(function (v) {
    sessionCookie = v;
  });
  return new Promise(async (OK, ERR) => {
    fs.readFile(
      `./userSessions/${sessionCookie}`,
      async function (err, buffer) {
        if (err) {
          console.log(err);
          ERR(err);
          return;
        }
        OK(JSON.parse(buffer.toString()));
        return;
      }
    );
  });
}

module.exports = {
  GetContentType,
  GetCorrectFile,
  ReadUserSessionFile,
};
