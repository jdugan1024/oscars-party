import express from "express";
import postgraphql from "postgraphql";
import path from "path";

const app = express();

const pgConfig = "postgres://oscars_postgraphql:xyz@localhost:5432/oscars";
const schemaName = "oscars";
const options = {
  graphiql: true,
  jwtSecret: "thirsty_keyboard_kitten",
  jwtPgTypeIdentifier: "oscars.jwt_token",
  pgDefaultRole: "oscars_anonymous"
};

const buildDir = path.join(__dirname, '/../../ui/build');

app.use(postgraphql(pgConfig, schemaName, options));
app.use(express.static(buildDir));

app.get('*', function (req, res) {
    res.sendFile(path.join(buildDir, '/index.html'));
});

app.listen(3001, () => {
  console.log("listening on port 3001");
});
