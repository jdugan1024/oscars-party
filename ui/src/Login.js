import React, { Component } from "react";
import _ from "underscore";
import Immutable  from "immutable";
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';

import FormRow from "./FormRow";

import {
    Form,
    FormEditStates,
    Schema,
    Field,
    TextEdit,
} from "react-dynamic-forms";


const schema = (
    <Schema>
        <Field name="email" label="Email" required={true} validation={{"format": "email"}} />
        <Field name="password" label="Password" required={true} validation={{"type": "string"}} />
    </Schema>
);

class LoginForm extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            value: Immutable.fromJS({
                email: null,
                password: null,
            }),
            loginState: null
        };
    }

    handleSubmit(e) {
        if (this.state.hasErrors || this.state.hasMissing) {
            console.log("no submit")
        } else {
            console.log("authInput", this.state.value.toJS());
            this.props.authenticate({
                variables: { authInput: this.state.value.toJS() },
                updateQueries: {
                    CurrentPerson: (prevData, { mutationResult }) => {
                        console.log("Update CurrentUser", {prevData, mutationResult});
                        const reply = mutationResult.data.authenticate.authenticateReply;
                        if (!reply) {
                            return { currentPerson: null };
                        } else {
                            return {
                                currentPerson: {
                                    name: reply.name,
                                    id: reply.personId,
                                    __typename: "Person"
                                }
                            }
                        }
                    }
                }
            }).then(
                ({ data }) => {
                    console.log('got data', data);
                    const reply = data.authenticate.authenticateReply;
                    if (!reply) {
                        console.error("unable to login", this);
                        window.localStorage.removeItem("jwtToken");
                        this.setState({ loginState: "fail" });
                    } else {
                        const jwtToken = reply.jwtToken;
                        console.log("login successful", data);
                        window.localStorage.setItem("jwtToken", jwtToken);
                        this.setState({ loginState: "success" });
                    }
                }).catch((error) => {
                    console.log('there was an error sending the query', error);
                });
        }
    }

    render() {
        const submitDisabled = this.state.hasErrors || this.state.hasMissing;
        if(window.localStorage.getItem("jwtToken")) {
            // XXX: force a reload -- the updateQueries maneouver above did no good
            const { pathname } = this.props.location.state ? this.props.location.state.from : { pathname: "/" };
            window.location.pathname = pathname;
        }


        let loginFailed = (<div></div>);
        if (this.state.loginState === "fail") {
            loginFailed = (<div>Login failed!</div>);
        }

        return (
            <div>
                <h4>Login</h4>
            <Form
                name="main"
                schema={schema}
                edit={FormEditStates.ALWAYS}
                value={this.state.value}
                onChange={(fieldName, value) => {
                        this.setState({ value })
                    }}
                onSubmit={this.handleSubmit}
                onMissingCountChange={(fieldName, missing) =>
                    this.setState({ hasMissing: missing > 0 })}
                onErrorCountChange={(fieldName, errors) =>
                    this.setState({ hasErrors: errors > 0 })} >
                <TextEdit field="email" width={300} />
            <TextEdit field="password"  type="password" width={300} />
            <FormRow>
            <input className="btn btn-default"
                   type="submit"
                   value="Login"
                   disabled={submitDisabled}
                   onClick={() => this.handleSubmit()} />
            </FormRow>
            </Form>
            {loginFailed}
            </div>
        );
    }
}

const authenticationMutation = gql`mutation Authenticate($authInput: AuthenticateInput!) {
  authenticate(input: $authInput) {
    authenticateReply {
      jwtToken
      personId,
      name
    }
  }
}`;

const Login = compose(
    graphql(authenticationMutation, { name: "authenticate" })
)(LoginForm);
/*
    props: ({ mutate }) => ({
        authenticate: (authInput) => {
            mutate({
                variables: { authInput }
            });
        },
    }),
})(LoginForm);
*/

export default Login;
