import React, { Component } from "react";
import _ from "underscore";
import { graphql, compose } from 'react-apollo';
import Immutable  from "immutable";
import { Chance } from "chance";

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
            <Field name="tiebreaker" label="How many Trump mentions?" required={true} validation={{"type": "number"}} />
            {categoryChoosers}
        </Schema>
    );
}
class PredictionsForm extends Component {
    static defaultProps = {
        mode: "edit"
    }

    componentWillMount() {
        this.state = {
            editMode: FormEditStates.ALWAYS,
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
        console.log("handleSubmit", this.state.value.toJS());
        this.state.value.forEach((nomineeId, categoryId) => {
            if(categoryId === "tiebreaker") {
                this.props.setTiebreaker({
                    variables: {
                        tiebreakerInput: {
                            tiebreaker: nomineeId
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
        })
    }

    render() {
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
                How many time's will the name Trump be mentioned from the stage?
                Must say Trump. Closest without going over wins.
            </div>
        );

        return (
            <Form
                name="main"
                schema={schema}
                edit={this.state.editMode}
                value={this.state.value}
                groupLayout={FormGroupLayout.COLUMN}
                onChange={(fieldName, value) => {
                        console.log("*** CHG VALUYE", value);
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
            </Form>
        );
    }
}
const PredictionsFormWithMutations = compose(
    graphql(SetPredictionMutation, { name: "setPrediction" }),
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
