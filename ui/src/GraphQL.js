import gql from 'graphql-tag';

export const CurrentUserQuery = gql`query CurrentPerson {
  currentPerson {
    nodeId,
    id,
    name,
    tiebreaker
  }
}`;

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
      nomineeId,
      personId
    }
  }
}`;

export const SetPredictionMutation = gql`
mutation SetPrediction($predictionInput: SetPredictionForPersonInput!) {
  setPredictionForPerson(input: $predictionInput) {
    prediction{
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


export const SetWinnerMutation = gql`
mutation CreateWinner($winnerInput: CreateWinnerInput!) {
  createWinner(input: $winnerInput) {
    winner {
      categoryId
      nomineeId
      __typename
    }
    __typename
  }
}
`;

export const RegisterPersonMutation = gql`
mutation RegisterPerson($personInput: RegisterPersonInput!) {
    registerPerson(input: $personInput) {
    person {
      id,
      name
    }
  }
}`;

export const AuthenticateMutation = gql`mutation Authenticate($authInput: AuthenticateInput!) {
  authenticate(input: $authInput) {
    authenticateReply {
      jwtToken
      personId,
      name
    }
  }
}`;

