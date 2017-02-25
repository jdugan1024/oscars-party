import gql from 'graphql-tag';

export const CategoryQuery = gql`
query Categoryies {
  allCategories {
    nodes {
      id,
      nodeId,
      name,
      points,
      nomineesByCategoryId {
        nodes {
          id
          name
        }
      }
    }
  }
}`;

export const CurrentPersonPredictionsQuery = gql`
query CurrentPersonPredictions {
  currentPersonPredictions {
    nodes {
      categoryId,
      nomineeId
    }
  }
}`;

export const SetPredictionMutation = gql`
mutation SetPrediction($predictionInput: SetPredictionForPersonInput!) {
  setPredictionForPerson(input: $predictionInput) {
    prediction{
      nodeId
      personId
      nomineeId
      categoryId
    }
  }
}`;

export const SetTiebreakerMutation = gql`
mutation SetTiebreaker($tiebreakerInput: SetTiebreakerForPersonInput!) {
  setTiebreakerForPerson(input: $tiebreakerInput){
    person {
      nodeId,
      tiebreaker
    }
  }
}
`;

