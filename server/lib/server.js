"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _postgraphql = require("postgraphql");

var _postgraphql2 = _interopRequireDefault(_postgraphql);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();

var pgConfig = "postgres://oscars_postgraphql:xyz@localhost:5432/oscars";
var schemaName = "oscars";
var options = {
  graphqlRoute: "/graphql",
  graphiql: true,
  graphiqlRoute: "/graphiql",
  jwtSecret: "thirsty_keyboard_kitten",
  jwtPgTypeIdentifer: "oscars.jwt_token",
  pgDefaultRole: "oscars_anonymous"
};

var pgql = (0, _postgraphql2.default)(pgConfig, schemaName, options);
console.log("pgql:", pgql);
app.use(pgql);

/*
app.get('/', function (req, res) {
    res.send('Hello World!')
})
*/

console.log("routes: ", app._router.stack);
app.listen(3001, function () {
  console.log("listening on port 3001");
});