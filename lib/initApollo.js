import { ApolloClient, InMemoryCache } from 'apollo-boost'
import { createHttpLink } from 'apollo-link-http'
import { WebSocketLink } from 'apollo-link-ws'
//import { SubscriptionClient } from 'subscriptions-transport-ws'
import { setContext } from 'apollo-link-context'
import fetch from 'isomorphic-unfetch'
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';


let apolloClient = null

// Polyfill fetch() on the server (used by apollo-client)
if (!process.browser) {
    global.fetch = fetch
}

function create (initialState, { getToken }) {
    const httpLink = createHttpLink({
        uri: 'http://localhost:4000/graphql',
        credentials: 'same-origin'
    })

  //const GRAPHQL_ENDPOINT = "ws://localhost:4000/graphql"
  //const client = new SubscriptionClient(GRAPHQL_ENDPOINT, {reconnect: true})
    const wsLink = process.browser
        ? new WebSocketLink({
            uri: 'ws://localhost:4000/subscriptions',
            options: {
                reconnect: true,
                //connectionParams: { authToken: getToken()}
            },
        })
        : null

    const authLink = setContext((_, { headers }) => {
        const token = getToken()
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : ''
            }
        }
    })

    const link = process.browser
        ? split(
            ({ query }) => {
                const { kind, operation } = getMainDefinition(query);
                return kind === 'OperationDefinition' && operation === 'subscription';
                },
            wsLink,
            httpLink
        )
        : httpLink;

  // Check out https://github.com/zeit/next.js/pull/4611 if you want to use the AWSAppSyncClient

    return new ApolloClient({
        fetch,
        connectToDevTools: process.browser,
        ssrMode: !process.browser, // Disables forceFetch on the server (so queries are only run once)
        link: authLink.concat(link),
        cache: new InMemoryCache({
            dataIdFromObject: result => {
                if (result.id && result.__typename)
                    return result.__typename + result.id;
                return null;
                },
        }).restore(initialState),
    })
}

export default function initApollo (initialState, options) {
  // Make sure to create a new client for every server-side request so that data
  // isn't shared between connections (which would be bad)
    if (!process.browser) {
        //console.log('In initApollo, no process.browser')
        return create(initialState, options)
    }
    // Reuse client on the client-side
    if (!apolloClient) {
        //console.log('In initApollo, there is process.browser, no apolloClient')
        apolloClient = create(initialState, options)
    }

    return apolloClient
}
