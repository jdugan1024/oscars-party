import React, { Component } from "react";

import oscarsImage from "../public/splash.jpg";

class Home extends Component {
    render() {
        return (
            <div>
                <img alt="[oscars]" src={oscarsImage} style={{width: "100%"}}/>
            </div>
        );
    }
}

export default Home;
