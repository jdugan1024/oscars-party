import React, { Component } from "react";
import _ from "underscore";
import { graphql, compose } from 'react-apollo';
import Immutable  from "immutable";
import { Chance } from "chance";
import { Redirect } from "react-router-dom";

import {
    Form,
    FormEditStates,
    FormGroupLayout,
    Schema,
    Field,
    TextEdit,
    Chooser
} from "react-dynamic-forms";

import {
    CategoryQuery,
    CurrentPersonPredictionsQuery,

    SetPredictionMutation,
    SetTiebreakerMutation
} from "./GraphQL";

import { secondsRemaining } from "./Time";

/*
 * CategoryList.propTypes = {
 *     data: PropTypes.shape({
 *         loading: PropTypes.bool.isRequired,
 *         currentUser: PropTypes.object,
 *     }).isRequired,
 * };
 */

function buildSchema(categories, mode) {
    const categoryChoosers = _.map(categories, (category) => {
        const name = category.name;
        const points = category.points;
        const label = `${name} (${points} Points)`;
        const fieldName = category.id.toString();
        return (
            <Field name={fieldName} key={name} label={label} required={true} />
        )
    });

    return (
        <Schema>
            <Field name="tiebreaker" label="How many Weinstein mentions?" required={true} validation={{"type": "number"}} />
            {categoryChoosers}
        </Schema>
    );
}
class PredictionsForm extends Component {
    static defaultProps = {
        mode: "edit"
    }

    componentWillMount() {
        console.log("remain", secondsRemaining());
        let editMode;
        if (secondsRemaining() >= -300) {
            editMode = FormEditStates.ALWAYS;
        } else {
            editMode = FormEditStates.NEVER;
        }

        this.state = {
            formSubmitted: false,
            editMode: editMode,
            value: this.initialValues(this.props.tiebreaker, this.props.predictions)
        };
    }

    initialValues(tiebreaker, predictions) {
        let value = { tiebreaker };
        _.each(predictions, (prediction) => {
            value[prediction.categoryId] = prediction.nomineeId;
        });

        value = Immutable.fromJS(value);

        return value;
    }


    handleRandom() {
        const chance = Chance();
        let value = this.state.value;
        const categories = this.props.categories;

        if(!this.state.value.get("tiebreaker")) {
            const r = chance.integer({ min: 0, max: 100 });
            value = value.set("tiebreaker", r.toString());
        }

        _.each(categories, (category) => {
            const fieldName = category.id.toString();
            if(!value.get(fieldName)) {
                const nominees = category.nomineesByCategoryId.nodes;
                const selection = chance.pickone(nominees);
                value = value.set(fieldName, selection.id);
            }
        });
        this.setState({ value });
    }

    handleSubmit(e) {
        if (this.state.hasMissing || this.state.hasErrors) {
            console.log("missing entries");
            return;
        }

        if (secondsRemaining() < -300) {
            console.log("too late to submit changes");
            return;
        }

        this.state.value.forEach((nomineeId, categoryId) => {
            if(categoryId === "tiebreaker") {
                this.props.setTiebreaker({
                    variables: {
                        tiebreakerInput: {
                            tiebreaker: parseInt(nomineeId, 10)
                        }
                    }});
            } else {
                this.props.setPrediction({
                    variables: {
                        predictionInput: {
                            categoryId,
                            nomineeId
                        }
                    }});
            }
        });

        this.setState({ formSubmitted: true });
    }

    render() {
        if (this.state.formSubmitted) {
            return (<Redirect to="/"/>);
        }

        const categories = _.sortBy(this.props.categories,
            (category) => category.points).reverse();

        const schema = buildSchema(categories);

        const awardItems = _.map(categories, (category) => {
            const points = category.points
            const nominees = category.nomineesByCategoryId.nodes;
            const options = Immutable.fromJS(nominees.map((nominee) => {
                return { id: nominee.id, label: nominee.name };
            }));

            return (
                <Chooser field={category.id.toString()}
                         choiceList={options}
                         width={300} disableSearch={true}
                         placeholder={`${points} Points`}
                         key={category.name} />
            )
        });

        const tiebreakerText = (
            <div style={{ width: "350px"}}>
                How many times will the Harvey Weinstein be mentioned from the stage?
                Must say his name. Closest without going over wins.
            </div>
        );

        let editable = (<div></div>);
        if (this.state.editMode === FormEditStates.ALWAYS) {
            editable = (
                <div>
                    <h4>Randomize Predictions</h4>
                    <p style={{ width: "350px" }}>
                        Use the randomize predictions button to randomly select choices for
                        any selections you haven't made yet. For the truly lazy.
                    </p>
                    <input className="btn btn-warning btn-xs"
                           type="submit"
                           value="Randomize Predictions"
                           onClick={() => this.handleRandom()} />
                    <hr/>
                    <input className="btn btn-default btn-primary"
                           type="submit"
                           value="Submit Predictions"
                           onClick={() => this.handleSubmit()} />
                </div>
            );
        }

        let editMessage = (<p></p>);
        if (this.state.editMode === FormEditStates.NEVER) {
            editMessage = (
                <h4>
                    The show has started. You can no longer change your predictions.
                </h4>
            );
        }

        return (
            <div>
                {editMessage}
                <Form
                    name="main"
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

                    {awardItems}

                    <h4>Tiebreaker</h4>
                    <TextEdit field="tiebreaker" width={50} />
                    {tiebreakerText}

                    {editable}

                </Form>
            </div>
        );
    }
}
const PredictionsFormWithMutations = compose(
    graphql(SetPredictionMutation, {
        props({ ownProps, mutate }) {
            return {
                setPrediction({ variables }) {
                    return mutate({
                        variables: variables,
                        // XXX this gets executed for each mutation, since we're doing
                        //     a bunch of small mutations this is super inefficient
                        refetchQueries: [{ query: CurrentPersonPredictionsQuery }]
                    })
                }
            }
        }
    }),
    graphql(SetTiebreakerMutation, { name: "setTiebreaker" })
)(PredictionsForm);

class Predictions extends Component {
    render() {
        if(this.props.categories.loading || this.props.predictions.loading) {
            return (<div>Loading...</div>);
        };

        const categories = this.props.categories.allCategories.nodes;
        const predictions = this.props.predictions.currentPersonPredictions.nodes;
        const tiebreaker = this.props.tiebreaker;

        return (
            <div>
                <h3>Your Predictions</h3>
                <PredictionsFormWithMutations
                    categories={categories}
                    predictions={predictions}
                    tiebreaker={tiebreaker}
                />
            </div>
        );
    }
}

export default compose(graphql(CategoryQuery, { name: "categories" }),
                       graphql(CurrentPersonPredictionsQuery, { name: "predictions" }),
)(Predictions);
