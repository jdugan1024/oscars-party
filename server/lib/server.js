"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _postgraphql = require("postgraphql");

var _postgraphql2 = _interopRequireDefault(_postgraphql);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _http = require("http");

var _http2 = _interopRequireDefault(_http);

var _socket = require("socket.io");

var _socket2 = _interopRequireDefault(_socket);

var _pg = require("pg");

var _pg2 = _interopRequireDefault(_pg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
var server = _http2.default.Server(app);
var io = new _socket2.default(server);

var pgConfig = "postgres://oscars_postgraphql:xyz@localhost:5432/oscars";
var schemaName = "oscars";
var options = {
    graphiql: true,
    jwtSecret: "thirsty_keyboard_kitten",
    jwtPgTypeIdentifier: "oscars.jwt_token",
    pgDefaultRole: "oscars_anonymous"
};

// globals for socketio
var users = 0;
var leaderboard = null;
var category = null;

var buildDir = _path2.default.join(__dirname, '/../../ui/build');

app.use((0, _postgraphql2.default)(pgConfig, schemaName, options));
app.use(_express2.default.static(buildDir));

app.get('*', function (req, res) {
    res.sendFile(_path2.default.join(buildDir, '/index.html'));
});

_pg2.default.connect(pgConfig, function (err, client) {
    if (err) {
        console.log("postgresql error:", err);
    }

    client.on('notification', function (msg) {
        console.log("NOTIFY", msg);
        if (msg.channel === "leaderboard") {
            leaderboard = msg.payload;
            console.log("leaderboard:", msg);
            io.emit("leaderboard", leaderboard);
        } else if (msg.channel === "category") {
            category = msg.payload;
            console.log("category:", msg);
            io.emit("category", category);
        }
    });

    client.query("LISTEN leaderboard");
    client.query("LISTEN category");
});

io.on("connection", function (socket) {
    users += 1;
    console.log("socket connect, total users:", users);

    io.emit("ping", "pong");
    io.emit("leaderboard", leaderboard);
    io.emit("category", category);

    socket.on("disconnect", function () {
        users -= 1;
        console.log("socket disconnect, total users:", users);
    });
});

setInterval(function () {
    io.emit("ping", "ping!");
}, 30000);

server.listen(3001, function () {
    console.log("listening on port 3001");
});