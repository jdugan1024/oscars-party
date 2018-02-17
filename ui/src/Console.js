import React, { Component } from "react";
import _ from "underscore";
import { graphql, compose } from 'react-apollo';
import Immutable  from "immutable";

import {
    Form,
    FormEditStates,
    FormGroupLayout,
    Schema,
    Field,
    Chooser
} from "react-dynamic-forms";

import {
    CategoryQuery,

    SetWinnerMutation
} from "./GraphQL";

/*
 * CategoryList.propTypes = {
 *     data: PropTypes.shape({
 *         loading: PropTypes.bool.isRequired,
 *         currentUser: PropTypes.object,
 *     }).isRequired,
 * };
 */

const schema = (
    <Schema>
        <Field name="category" label="Category" tags={["all"]} required={true} />
        <Field name="winner" label="Winner" tags={["Category"]} required={true} />
    </Schema>
);

class ConsoleForm extends Component {
    static defaultProps = {
        mode: "edit"
    }

    componentWillMount() {
        const editMode = FormEditStates.ALWAYS;

        this.state = {
            formSubmitted: false,
            editMode: editMode,
            value: Immutable.fromJS({})
        };
    }

    handleSubmit(e) {
        const value = this.state.value;
        const category = value.get("category");
        const winner = value.get("winner");
        console.log("got", category,winner, value, this);


        if (!category && !winner) {
            return;
        }

        if (category && !winner) {
            console.log("update current category", category);
        }

        if (category && winner) {
            console.log("update winner", category, winner)
            const winnerInput = {winner: {categoryId: category, nomineeId: winner}};
            this.props.setWinner({ variables: { winnerInput }});
        }
    }

    render() {
        console.log("Console", this.props);
        if(this.props.person.name !== "Jon") {
            return (<div>Access denied.</div>);
        }
        const categories = _.sortBy(this.props.categories, (category) => category.name);

        let nomineeChoiceMap = {};
        const categoryChoices = _.map(categories, (item) => {
            nomineeChoiceMap[item.id] = _.map(item.nomineesByCategoryId.nodes, (nom) => {
                return { id: nom.id, label: nom.name };
            });
            return { id: item.id, label: item.name};
        });

        const category = this.state.value.get("category");
        const nomineeChoices = category ? nomineeChoiceMap[category] : [];

        return (
            <div>
                <Form
                    name="console"
                    schema={schema}
                    edit={this.state.editMode}
                    value={this.state.value}
                    groupLayout={FormGroupLayout.COLUMN}
                    onChange={(fieldName, value) => {
                            this.setState({ value })
                        }}
                    onSubmit={this.handleSubmit}
                    onMissingCountChange={(fieldName, missing) =>
                        this.setState({ hasMissing: missing > 0 })}
                    onErrorCountChange={(fieldName, errors) =>
                        this.setState({ hasErrors: errors > 0 })} >

                    <Chooser field="category"
                             choiceList={Immutable.fromJS(categoryChoices)}
                             width={300}
                             disableSearch={true}
                             key="category-chooser" />

                    <Chooser field="winner"
                             choiceList={Immutable.fromJS(nomineeChoices)}
                             width={300}
                             disableSearch={true}
                             key="winner-chooser" />
                    <hr/>
                    <input className="btn btn-default btn-primary"
                           type="submit"
                           value="Submit"
                           onClick={() => this.handleSubmit()} />
                </Form>
            </div>
        );
    }
}

const ConsoleFormWithMutations = compose(
    graphql(SetWinnerMutation, { name: "setWinner" })
)(ConsoleForm);

class Console extends Component {
    render() {
        if(this.props.categories.loading) {
            return (<div>Loading...</div>);
        };

        const categories = this.props.categories.allCategories.nodes;

        return (
            <div>
                <h3>Console</h3>
                <ConsoleFormWithMutations
                    categories={categories}
                    person={this.props.person} />
            </div>
        );
    }
}

export default compose(
    graphql(CategoryQuery, { name: "categories" })
)(Console);
