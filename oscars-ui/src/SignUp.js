import React, { Component } from "react";
import { Link } from "react-router-dom";
import Immutable  from "immutable";
import { graphql } from "react-apollo";
import gql from "graphql-tag";
import _ from "underscore";

import {
    Form,
    FormEditStates,
    Schema,
    Field,
    TextEdit,
} from "react-dynamic-forms";

import FormRow from "./FormRow";

const SCHEMA = (
    <Schema>
        <Field name="name" label="Name" required={true} validation={{"type": "string"}} />
        <Field name="email" label="Email" required={true} validation={{"format": "email"}} />
        <Field name="password1" label="Password" required={true} validation={{"type": "string", minLength: 6}} />
        <Field name="password2" label="Password (again)" required={true} validation={{"type": "string", minLength: 6}} />
    </Schema>
);

const duplicateEmailRegex = /duplicate key.*email_key/

class PersonForm extends Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            editMode: FormEditStates.ALWAYS,
            profileCreated: false,
            profileError: null,
            value: Immutable.fromJS({
                name: null,
                email: null,
                password1: null,
                password2: null
            })
        }
    }

    handleSubmit() {
        console.log("handleSubmit", this.state.value.toJS());
        const personInput = {
            name: this.state.value.get("name"),
            email: this.state.value.get("email"),
            password: this.state.value.get("password1"),
        };

        this.props.registerPerson({ variables: { personInput }})
            .then(({ data }) => {
                console.log("register data->", data);
                if(data.registerPerson) {
                    this.setState({ profileCreated: true });
                }
            })
            .catch((err) => {
                console.error('Logout failed', err);
                if (err.message.match(duplicateEmailRegex)) {
                    this.setState({ profileError: "Can't create profile: email is already in use." });
                } else {
                    this.setState({ profileError: err.message });
                }
            });
    }

    renderForm() {
        const password1 = this.state.value.get("password1");
        const password2 = this.state.value.get("password2");
        const passwordsMatch = password1 && password2 && password1 === password2;
        console.log("PW", password1, password2, passwordsMatch);
        let disableSubmit = true;
        if (!this.state.hasMissing && !this.state.hasErrors && passwordsMatch) {
            disableSubmit = false;
        }

        let passwordWarning = (<div></div>);
        if (password1 && password2 && !passwordsMatch) {
            passwordWarning = (
                <div className="help-block has-error" style={{color: "#b94a48"}}>
                    Passwords don't match!
                </div>
            );
        }

        let profileErrorMessage = null;
        if (this.state.profileError) {
            profileErrorMessage = (
                <div style={{ color: "red" }}>
                    {this.state.profileError}
                </div>
            );
        }

        return (
            <div>
                <h1>Sign Up</h1>
                <Form
                    name="person"
                    schema={SCHEMA}
                    edit={this.state.editMode}
                    value={this.state.value}
                    onChange={(fieldName, value) => { this.setState({ value }) }}
                    onMissingCountChange={(fieldName, missing) => { this.setState({ hasMissing: missing > 0 })}}
                    onErrorCountChange={(fieldName, errors) => { this.setState({ hasErrors: errors > 0 })}}>
                    <TextEdit field="name"  width={200} />
                    <TextEdit field="email" width={200} />
                    <TextEdit field="password1" type="password" width={200} />
                    <TextEdit field="password2" type="password" width={200} />
                    <FormRow>
                        {passwordWarning}
                    </FormRow>
                    <br/>

                    <FormRow>
                        <input className="btn btn-default"
                               type="submit"
                               value="Sign Up"
                               disabled={disableSubmit}
                               onClick={() => this.handleSubmit()} />
                    </FormRow>
                    <hr/>
                    <FormRow>
                        {profileErrorMessage}
                    </FormRow>
                </Form>
            </div>
        );
    }

    renderSuccess() {
        return (
            <div>
                <h1>Sign Up Successful</h1>

                <p className="lead">
                    Click <Link to="/predictions">here</Link> to log in and make your predictions.
                </p>
            </div>
        );
    }

    render() {
        if(this.state.profileCreated) {
            return this.renderSuccess();
        } else {
            return this.renderForm();
        }
    }

}

const RegisterPersonMutation = gql`
mutation RegisterPerson($personInput: RegisterPersonInput!) {
  registerPerson(input: $personInput) {
    person {
      id,
      name
    }
  }
}`;

const PersonFormWithMutation = graphql(RegisterPersonMutation, { name: "registerPerson" })(PersonForm);

class SignUp extends Component {
    render() {
        return (
            <PersonFormWithMutation />
        );
    }
}

export default SignUp;
