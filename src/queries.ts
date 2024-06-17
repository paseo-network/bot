import { gql } from "graphql-request";

export interface AccountData {
  id: string;
  total: string;
  free: string;
  reserved: string;
}

export interface BalancesResponse {
  accountsConnection: {
    edges: Array<{ node: AccountData }>;
    totalCount: number;
    pageInfo: {
      endCursor: string;
      hasNextPage: boolean;
    };
  };
}

export type BalancesVariables = {
  after?: string;
  threshold: string;
} & Record<string, unknown>;

export const balancesQuery = gql`
  query Balances($after: String, $threshold: BigInt) {
    accountsConnection(first: 50, after: $after, orderBy: total_DESC, where: { free_gt: $threshold }) {
      edges {
        node {
          id
          total
          free
          reserved
        }
      }
      totalCount
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;
