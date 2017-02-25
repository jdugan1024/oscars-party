import React, { Component } from "react";

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

    componentDidMount() {
        this.calculateRemaining();
        var intervalId = setInterval(this.calculateRemaining.bind(this), 1000);
        this.setState({intervalId});
    }

    componentWillUnmount() {
        if (this.state.intervalId) {
            clearInterval(this.state.intervalId);
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
            </div>
        );
    }

    renderDashboard() {
        return (
            <div>This is the dashboard!</div>
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
