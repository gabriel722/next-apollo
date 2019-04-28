import gql from 'graphql-tag'

export default apolloClient =>
apolloClient
.query({
    query: gql`
        query getUser {
            loginCheck {
                name
            }
        }
    `
})
.then(({ data }) => {
    console.log('checkLoggedIn return a data object.')
    console.log(data)
    return { result: data }
})
.catch(() => {
    console.log('checkLoggedIn failed')
    return { result: {} }
})
