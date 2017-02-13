import React, { Component } from "react";
import { BrowserRouter, Match, Miss } from "react-router";

import Home from "./Home";
import Dashboard from "./Dashboard";
import SignUp from "./SignUp";

class NoMatch extends Component {
    render() {
        return (
            <div>No match!</div>
        );
    }
}

class App extends Component {
    render() {
        console.log({BrowserRouter, Match, Miss, NoMatch});
        return (
            <BrowserRouter>
                <div className="App">
                    <div className="row">
                        <div className="col-sm-1">
                        </div>
                        <div className="col-sm-10 main">
                            <Match exactly pattern="/" component={Home} />
                            <Match pattern="/dashboard" component={Dashboard} />
                            <Match pattern="/signup" component={SignUp} />

                            <Miss component={NoMatch} />
                        </div>
                    <div className="col-sm-1">
                    </div>
                    </div>
                </div>
            </BrowserRouter>
        );
    }
}

export default App;
