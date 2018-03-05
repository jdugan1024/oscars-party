import React, { Component } from "react";
import io from "socket.io-client";
import _ from "underscore";

import { secondsRemaining } from  "./Time";

function pad(number) {
    return ("0" + number).slice(-2);
}

class CountdownDisplay extends Component {
    render() {
        const colonStyle = {
            "paddingLeft": "8px",
            "paddingRight": "8px",
        };

        const fontSize = window.innerWidth / 11;
        const numberStyle = {
            padding: "0px",
            width: 1.2 * fontSize
        };


        return (
            <table style={{margin: "0 auto", background: "black" }}>
                <tbody>
                    <tr style={{"fontSize": fontSize}}>
                        <td style={numberStyle}>{this.props.days}</td>
                        <td style={colonStyle}>:</td>
                        <td style={numberStyle}>{this.props.hours}</td>
                        <td style={colonStyle}>:</td>
                        <td style={numberStyle}>{this.props.minutes}</td>
                        <td style={colonStyle}>:</td>
                        <td style={numberStyle}>{this.props.seconds}</td>
                    </tr>
                    <tr>
                        <td className="text-center">days</td>
                        <td></td>
                        <td className="text-center">hours</td>
                        <td></td>
                        <td className="text-center">minutes</td>
                        <td></td>
                        <td className="text-center">seconds</td>
                    </tr>
                </tbody>
            </table>
        );
    }
}

class LeaderBoard extends Component {
    render() {
        const sortedLeaderboard = _.sortBy(this.props.leaderboard, (item) => item.score)
                                   .reverse();
        const rows = _.map(sortedLeaderboard, (item) => {
            const name = item.name;
            const score = item.score ? item.score : 0;
            const key = "" + name + "--" + item.id;
            return (
                <tr key={key}>
                    <td>{name}</td>
                    <td>{score}</td>
                </tr>
            )
        });

        return (
            <div className="row">
                <div className="col-sm-9">
                    <h4>Leaderboard</h4>
                    <table className="table table-striped table-condensed">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

class CurrentCategory extends Component {
    render() {
        const sortedCategory = _.sortBy(this.props.category, (item) => item.count)
                                   .reverse();
        const rows = _.map(sortedCategory, (item) => {
            const name = item.name;
            const count = item.count ? item.count : 0;
            const key = "" + name + "--" + item.id;
            return (
                <tr key={key}>
                    <td>{name}</td>
                    <td>{count}</td>
                </tr>
            )
        });

        const currentCategory = this.props.category ? this.props.category[0].category : "Not Started Yet";

        return (
            <div className="row">
                <div className="col-sm-9">
                    <h4>{currentCategory}</h4>
                    <table className="table table-striped table-condensed">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}


class Dashboard extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            days: null,
            hours: null,
            minutes: null,
            seconds: null
        }
    }

    componentWillMount() {
        this.socket = io();
        this.socket.on("ping", (msg) => console.log("PING:", msg));
        this.socket.on("leaderboard", (msg) => {
            console.log("leaderboard update", msg);
            this.setState({ leaderboard: JSON.parse(msg) })
        });
        this.socket.on("category", (msg) => {
            console.log("category update", msg);
            this.setState({ category: JSON.parse(msg) })
        });
    }

    componentDidMount() {
        this.calculateRemaining();
        var intervalId = setInterval(this.calculateRemaining.bind(this), 1000);
        this.setState({intervalId});
    }

    componentWillUnmount() {
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
        }
        if(this.socket) {
            console.log("closing socket");
            this.socket.close();
        }
    }

    calculateRemaining() {
        var howLong = secondsRemaining();
        const days = pad(Math.floor(howLong / (24*3600)));
        let remainder = howLong % (24*3600);
        const hours = pad(Math.floor(remainder / 3600));
        remainder %= 3600;
        const minutes = pad(Math.floor(remainder / 60));
        const seconds = pad(Math.round(remainder % 60));

        let intervalId = this.state.intervalId;
        if(howLong < 0) {
            clearInterval(intervalId);
            intervalId = null;
        }

        this.setState({ howLong, days, hours, minutes, seconds, intervalId });
    }

    renderCountdown() {
        return (
            <div>
                <h3 className="text-center">
                    The Academy Awards will start in:
                </h3>
                <CountdownDisplay
                    days={this.state.days}
                    hours={this.state.hours}
                    minutes={this.state.minutes}
                    seconds={this.state.seconds}
                />

                <hr/>
            </div>
        );
    }

    renderDashboard() {
        return (
            <div className="row">
                    <CurrentCategory category={this.state.category} />
                    <LeaderBoard leaderboard={this.state.leaderboard} />
            </div>
        )
    }

    render() {
        if(this.state.howLong < 0) {
            return this.renderDashboard()
        } else {
            return this.renderCountdown();
        }
    }

}

export default Dashboard;
