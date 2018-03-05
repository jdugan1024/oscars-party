import express from "express";
import postgraphql from "postgraphql";
import path from "path";
import http from "http";
import SocketIO from "socket.io";
import pg from "pg";


const app = express();
let server = http.Server(app);
let io = new SocketIO(server);


const pgConfig = "postgres://oscars_postgraphql:xyz@localhost:5432/oscars";
const schemaName = "oscars";
const options = {
  graphiql: true,
  jwtSecret: "thirsty_keyboard_kitten",
  jwtPgTypeIdentifier: "oscars.jwt_token",
  pgDefaultRole: "oscars_anonymous"
};

// globals for socketio
let users = 0;
let leaderboard = null
let category = null

const buildDir = path.join(__dirname, '/../../ui/build');

app.use(postgraphql(pgConfig, schemaName, options));
app.use(express.static(buildDir));

app.get('*', function (req, res) {
    res.sendFile(path.join(buildDir, '/index.html'));
});

pg.connect(pgConfig, function(err, client) {
    if(err) {
        console.log("postgresql error:", err);
    }

    client.on('notification', function(msg) {
        console.log("NOTIFY", msg);
        if(msg.channel === "leaderboard") {
            leaderboard = msg.payload;
            console.log("leaderboard:",  msg);
            io.emit("leaderboard", leaderboard);
        } else if (msg.channel === "category") {
            category = msg.payload;
            console.log("category:", msg);
            io.emit("category", category);
        }
    });

    client.query("LISTEN leaderboard");
    client.query("LISTEN category");
    client.query("SELECT oscars.winner_notify();")
    client.query("SELECT oscars.current_category_notify();")
});


io.on("connection", (socket) => {
    users +=1;
    console.log("socket connect, total users:", users);

    io.emit("ping", "pong");
    io.emit("leaderboard", leaderboard);
    io.emit("category", category);

    socket.on("disconnect", () => {
        users -= 1;
        console.log("socket disconnect, total users:", users);
    });
});


setInterval(() => { io.emit("ping", "ping!")}, 30000);

server.listen(3001, () => {
  console.log("listening on port 3001");
});

