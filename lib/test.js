import { ApolloClient } from 'apollo-client';
import { split } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { getMainDefinition } from 'apollo-utilities';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'isomorphic-unfetch';
import tokenStore from '../utils/token-store';

let apolloClient;

const httpLink = createHttpLink({
    uri: '/graphql',
});

const wsLink = process.browser
    ? new WebSocketLink({
        uri: 'ws://localhost:3000/subscriptions',
        options: {
            reconnect: true,
        },
    })
    : null;

const authLink = setContext((_, { headers }) => {
    const token = tokenStore.get('token');

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        },
    };
});

const createErrorLink = context =>
    onError(({ graphQLErrors, networkError = {}, operation, forward }) => {
        // 인증 에러
        if (
            graphQLErrors &&
            graphQLErrors.some(n => n.message === 'Required Login') &&
            process.browser
        ) {
            window.location.href = '/login';
        }

        // 서버 에러인 경우
        if (networkError.statusCode === 500) {
            // TODO: 500 페이지로 이동
            console.error('Server returned an error');
        }
    });

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

const createClient = (initialState, context) => {
    const { headers = {} } = context.req || {};
    const errorLink = createErrorLink(context);

    return new ApolloClient({
        link: authLink.concat(errorLink).concat(link),
        fetch,
        headers,
        cache: new InMemoryCache({
            dataIdFromObject: result => {
                if (result.id && result.__typename)
                    return result.__typename + result.id;
                return null;
            },
        }).restore(initialState),
    });
};

export default (initialState = {}, context = {}) => {
    if (!process.browser) {
        return createClient(initialState, context);
    }
    if (!apolloClient) {
        apolloClient = createClient(initialState, context);
    }
    return apolloClient;
};