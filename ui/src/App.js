import React, { Component } from "react";
import {
    BrowserRouter as Router,
    Route,
    Switch,
    Redirect,
    Link
} from "react-router-dom";

import ApolloClient, { createNetworkInterface } from "apollo-client";
import { ApolloProvider } from 'react-apollo';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

import Home from "./Home";
import Dashboard from "./Dashboard";
import SignUp from "./SignUp";
import Login from "./Login";
import Predictions from "./Predictions";

import Immutable from "immutable";
import installDevTools from "immutable-devtools";
installDevTools(Immutable);

import jwtDecode from "jwt-decode";

import oscarsIcon from "../public/oscars-icon.png";
const networkInterface = createNetworkInterface({ uri: "/graphql" });

function isAuthenticated() {
    return window.localStorage.getItem("jwtToken") != null;
}

networkInterface.use([{
    applyMiddleware(req, next) {
        console.log("middleware");
        if (!req.options.headers) {
            req.options.headers = {};  // Create the header object if needed.
        }

        // get the authentication token from local storage if it exists
        const token = localStorage.getItem("jwtToken");

        if(token) {
            const jwt = jwtDecode(token);
            console.log("JWT->", jwt);
            if (jwt.exp < Date.now() / 1000) {
                console.log("JWT expired. Clearing.");
                window.localStorage.removeItem("jwtToken");
            } else {
                req.options.headers.authorization = `Bearer ${token}`;
            }
        }

        next();
  }
}]);

const client = new ApolloClient({ networkInterface });

const PrivateRoute = ({ component, ...rest }) => (
  <Route {...rest} render={props => (
    isAuthenticated() ? (
      React.createElement(component, props)
    ) : (
      <Redirect to={{
        pathname: '/login',
        state: { from: props.location }
      }}/>
    )
  )}/>
)

class NoMatch extends Component {
    render() {
        return (
            <div>No match!</div>
        );
    }
}

/*
                <nav className="navbar navbar-default">
                    <div className="container-fluid">
                        <div className="navbar-header">
                            <button type="button" className="navbar-toggle collapsed">
                                <span className="sr-only">Toggle navigation</span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                                <span className="icon-bar"></span>
                            </button>
                            <a className="navbar-brand" href="/">
                                <img alt="Oscars" src={oscarsIcon} height={20} />
                            </a>
                        </div>

                        <div className="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                            <ul className="nav navbar-nav">
                                <li className="active"><a href="#">Predictions</a></li>
                                <li><a href="/">Dashboard</a></li>
                            </ul>
                            <ul className="nav navbar-nav navbar-right">
                                <li><a href="/logout/">Logout</a></li>
                            </ul>
                        </div>
                    </div>
                </nav>

*/

class MainLayout extends Component {
    render() {
        const user = this.props.data.currentPerson;
        const name = user ? this.props.data.currentPerson.name : "Guest";
        let links = null;
        if (!user) {
            links = (
                <div>
                    Want to play?
                    <br />
                    <Link to="/signup">Sign up here!</Link>
                    <br />
                    <Link to="/login">Login</Link>
                    <br />
                    <Link to="/dashboard">Dashboard</Link>
                </div>
            );
        } else {
            links = (
                <div>
                    <Link to="/logout">Logout</Link>
                    <br/>
                    <Link to="/predictions">My Predictions</Link>
                    <br/>
                    <Link to="/dashboard">Dashboard</Link>
                </div>
            );
        }
        return (
            <div className="App">
                <div className="row">
                    <div className="col-sm-2">
                        <Link to="/">
                            <img alt="Oscars" src={oscarsIcon} height={96} style={{ marginTop: "20px" }}/>
                        </Link>
                        <br />
                        <br />
                        <div style={{ marginLeft: "12px" }}>
                            <p>
                                Hello, {name}!
                            </p>
                            <br />
                            {links}
                        </div>
                    </div>
                    <div className="col-sm-9 main">
                        <Switch>
                            <Route exact path="/" render={() => {
                                    return (<Home user={user} />)}} />
                            <Route path="/dashboard" component={Dashboard} />
                            <PrivateRoute path="/predictions" component={Predictions} />
                            <Route path="/signup" component={SignUp} />
                            <Route path="/login" component={Login} />
                            <Route path="/logout" render={() => {
                                    window.localStorage.removeItem("jwtToken")
                                    return (<Redirect to="/"/>);
                                }} />
                            <Route component={NoMatch} />
                        </Switch>
                    </div>
                    <div className="col-sm-1">
                    </div>
                </div>
            </div>
        )
    }
}

const CurrentUserQuery = gql`query CurrentPerson {
  currentPerson {
    id,
    name
  }
}`;

const MainLayoutWithCurrentUser = graphql(CurrentUserQuery)(MainLayout)

class App extends Component {
    render() {
        return (
            <Router>
                <ApolloProvider client={client}>
                    <MainLayoutWithCurrentUser/>
                </ApolloProvider>
            </Router>
        );
    }
}

export default App;
