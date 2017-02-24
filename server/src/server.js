import express from "express";
import postgraphql from "postgraphql";

const app = express();

const pgConfig = "postgres://oscars_postgraphql:xyz@localhost:5432/oscars";
const schemaName = "oscars";
const options = {
  graphiql: true,
  jwtSecret: "thirsty_keyboard_kitten",
  jwtPgTypeIdentifier: "oscars.jwt_token",
  pgDefaultRole: "oscars_anonymous"
};

app.use(postgraphql(pgConfig, schemaName, options));

app.get('/', function (req, res) {
    res.send('Hello World!')
});

app.listen(3001, () => {
  console.log("listening on port 3001");
});
