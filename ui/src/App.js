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

import Immutable from "immutable";
import installDevTools from "immutable-devtools";
installDevTools(Immutable);

import jwtDecode from "jwt-decode";

import oscarsIcon from "../public/oscars-icon.png";
const networkInterface = createNetworkInterface({ uri: "/graphql" });

import Home from "./Home";
import Dashboard from "./Dashboard";
import SignUp from "./SignUp";
import Login from "./Login";
import Predictions from "./Predictions";
import Console from "./Console";

import { CurrentUserQuery } from "./GraphQL.js";

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
            const tokenDetails = jwtDecode(token);
            if (tokenDetails.exp < Date.now() / 1000) {
                // XXX notify user
                window.localStorage.removeItem("jwtToken");
            } else {
                req.options.headers.authorization = `Bearer ${token}`;
            }
        }

        next();
  }
}]);

const client = new ApolloClient({
    networkInterface,
    connectToDevTools: true,
    dataIdFromObject: (result) => {
        if (result.__typename && result.__typename === "Prediction") {
            return  "Prediction:" + result.categoryId + ":" + result.personId;
        } else if (result.nodeId) {
            return result.nodeId;
        }

        // Make sure to return null if this object doesn't have an ID
        return null;
    }
});

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

class MainLayout extends Component {
    render() {
        const person = this.props.person;
        const name = person ? person.name : "Guest";
        const tiebreaker = person ? person.tiebreaker : null;

        console.log("PERSON", person, this.props);
        let links = null;
        if (!person) {
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
                    <Link to="/predictions">My Predictions</Link>
                    <br/>
                    <Link to="/dashboard">Dashboard</Link>
                    <br/>
                    <Link to="/logout">Logout</Link>
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
                                    return (<Home person={person} />)}} />
                            <Route path="/dashboard" component={Dashboard} />
                            <PrivateRoute path="/predictions" component={() => (<Predictions tiebreaker={tiebreaker}/>)} />
                            <PrivateRoute path="/console" component={() => (<Console person={person}/>)} />
                            <Route path="/signup" component={SignUp} />
                            <Route path="/login" component={Login} />
                            <Route path="/logout" render={() => {
                                    window.localStorage.removeItem("jwtToken");
                                    // destroy the cache since we're logging out
                                    client.resetStore();
                                    return (
                                        <Link to="/"/>
                                    );
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

const MainLayoutWithCurrentUser = graphql(CurrentUserQuery, {
    props: ({ ownProps, data: { loading, currentPerson, refetch } }) => ({
        personLoading: loading, person: currentPerson, personRefetch: refetch})

})(MainLayout);

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
