import React, { Component } from "react";
import _ from "underscore";
import Immutable  from "immutable";
import installDevTools from "immutable-devtools";

installDevTools(Immutable);

import {
    Form,
    FormEditStates,
    Schema,
    Field,
    TextEdit,
    Chooser
} from "react-dynamic-forms";

import nomineesRaw from '../../2017oscars.json';
const nominees = nomineesRaw.slice(0,3);


function buildSchema(nominees) {
    const categoryChoosers = _.map(nominees, (nominee) => {
        const category = nominee.category;
        const points = nominee.points;
        const label = `${category} (${points} Points)`;
        return (
            <Field name={category} key={category} label={label} required={true} />
        )
    });

    return (
        <Schema>
            <Field name="name" label="Name" required={true} validation={{"type": "string"}} />
            <Field name="email" label="Email" required={true} validation={{"format": "email"}} />
            <Field name="trumpMentions" label="How many Trump mentions?" required={true} validation={{"type": "number"}} />
            {categoryChoosers}
        </Schema>
    );
}

const schema = buildSchema(nominees);
const categories = _.map(nominees, (nominee) => nominee.category);

class ContestForm extends Component {
    constructor(props, context) {
        super(props, context);

        let value = {
            name: null,
            email: null,
            trumpMentions: null
        };

        _.map(categories, (category) => {
            value[category] = null;
        });

        this.state = {
            editMode: FormEditStates.ALWAYS,
            value: Immutable.fromJS(value)
        }
    }

    handleSubmit(e) {
        console.log("handleSubmit", this.state.value.toJS());
        this.setState({
            editMode: FormEditStates.SELECTED
        });
    }

    render() {
        let disableSubmit = true;
        let categoryMap = {};
        _.each(nominees, (nominee) => {
            categoryMap[nominee.category] = nominee;
        });

        const awardItems = _.map(categories, (category) => {
            const nominees = categoryMap[category].nominees;
            const points = categoryMap[category].points;

            return (
                <Chooser field={category}
                         choiceList={nominees}
                         width={300} disableSearch={true}
                         placeholder={`${points} Points`} />
            )
        });

        if (this.state.editMode === FormEditStates.ALWAYS) {
            if (this.state.hasErrors === false && this.state.hasMissing === false) {
                disableSubmit = false;
            }
        }

        return (
            <Form
                name="main"
                schema={schema}
                edit={this.state.editMode}
                value={this.state.value}
                onChange={(fieldName, value) => {
                        this.setState({ value })
                    }}
                onSubmit={this.handleSubmit}
                onMissingCountChange={(fieldName, missing) =>
                    this.setState({ hasMissing: missing > 0 })}
                onErrorCountChange={(fieldName, errors) =>
                    this.setState({ hasErrors: errors > 0 })} >
                <h4>Your info</h4>
                <TextEdit field="name" allowEdit={true} width={300} />
                <TextEdit field="email" width={300} />
                <h4>Awards</h4>
                {awardItems}
                <h4>Tiebreaker</h4>
                <TextEdit field="trumpMentions" width={50} />
                <hr />
                <input className="btn btn-default" type="submit" value="Submit" disabled={disableSubmit}
                       onClick={() => this.handleSubmit()} />
            </Form>
        );
    }
}

export default ContestForm;
