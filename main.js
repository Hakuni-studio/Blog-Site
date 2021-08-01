require("dotenv").config();
const fs = require("fs");
const http = require("http");
const files = require("./files");
const templates = require("./templates");
const posts = require("./httpPosts");
const cookies = require("./cookies");
const config = require("./config.json");

const hostname = "10.0.0.25";
const port = 80;

// Get requests
const server = http.createServer(async (req, res) => {
  // POST request
  if (req.method === "POST") {
    await posts.HandlePost(req, res);
  }
  // Get request
  if (req.method === "GET") {
    var sessionFoundAndRedirected = false;
    // Modify the raw path
    const path = req.url.replace(/\//g, "").toLowerCase();
    if(path === "loginlogout"){
      await cookies.DeleteSession(req, res);
      return;
    }

    // Check if the path is in pathNotAllowedIfLoggedIn array
    if (config.pathNotAllowedIfLoggedIn.includes(path)) {
      // Get all cookies form the user
      const cookiesJson = JSON.parse(JSON.stringify(cookies.ParseCookies(req)));

      // Get only sessions cookie from the user
      const sessionCookie = cookiesJson[process.env.SESSION_COOKIE_NAME];

      // User has session cookie
      if (sessionCookie) {
        // Check if session cookie is valid/active
        await cookies
          .CheckSessionCookieValidation(sessionCookie)
          .then(function (v) {
            sessionFoundAndRedirected = v;
          });
      }
    }
    if (sessionFoundAndRedirected) {
      // Redirect user to the main page
      res.writeHead(302, {
        Location: `http://${req.headers.host}/`,
      });
      res.end(); // End
      return;
    }
    // Get file to give the user
    const file = await files.GetCorrectFile(req.url);

    // Get the file to serve the user
    fs.readFile(`./public_html${file}`, "utf8", async (err, data) => {
      if (err) {
        console.log(`16: ${err}`);
        // -2 is 404
        if (err.errno == -2) {
          res.writeHead(404, {
            "Content-Type": `${files.GetContentType(req.url)};charset=UTF-8`,
          });
          res.end("404 - Can't find page");
        }
        return;
      }

      // Write finalized head to serving the user
      res.writeHead(200, {
        "Content-Type": `${files.GetContentType(req.url)};charset=UTF-8`,
      });

      // Fill all the placeholders with correct information
      const filledData = await templates.FillPlaceholders(data, req, {});
      //data = data.replace(/</g, "&lt;").replace(/>/g, "&gt;"); XSS
      // Write the finalized data to the response
      res.write(filledData);
      // Serve the user
      res.end();
      return;
    });
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running on http://${hostname}:${port}`);
});
