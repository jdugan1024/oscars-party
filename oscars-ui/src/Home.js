import React, { Component } from "react";

import oscarsImage from "../public/splash.jpg";

class Home extends Component {
    render() {
        return (
            <div>
                <img src={oscarsImage} style={{width: "100%"}}/>

                <div className="text-center">
                    Want to play? <a href="/signup">Sign up here!</a>
                    <br />
                    <a href="/dashboard">Dashboard</a>
                </div>
            </div>
        );
    }
}

export default Home;
