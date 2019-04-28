import React from 'react'
import cookie from 'cookie'
import PropTypes from 'prop-types'
import { getDataFromTree } from 'react-apollo'
import Head from 'next/head'

import initApollo from './initApollo'

function parseCookies (req, options = {}) {
  return cookie.parse(req ? req.headers.cookie || '' : document.cookie, options)
}

export default App => {
  return class WithData extends React.Component {
    static displayName = `WithData(basic)`
    static propTypes = {
      apolloState: PropTypes.object.isRequired
    }

    static async getInitialProps (context) {
      //console.log(ctx.ctx)
      const { Component, router, ctx: { req, res } } = context
      const apollo = initApollo({}, { getToken: () => parseCookies(req).token })
      //console.log('withApollo')
      context.ctx.apolloClient = apollo
      let appProps = {}

      if (App.getInitialProps) {
        //console.log(ctx)
        //console.log(context)
        appProps = await App.getInitialProps(context)
        //console.log(appProps)
        //console.log(Component)
      }

      if (res && res.finished) {
        // When redirecting, the response is finished.
        // No point in continuing to render
        //console.log('res && res.finished')
        return {}
      }

      if (!process.browser) {
        // Run all graphql queries in the component tree
        // and extract the resulting data
        //console.log('In withApollo there is no process.browser')
        try {
          // Run all GraphQL queries
          await getDataFromTree(
            <App
              {...appProps}
              Component={Component}
              router={router}
              apolloClient={apollo}
            />
          )
        } catch (error) {
          // Prevent Apollo Client GraphQL errors from crashing SSR.
          // Handle them in components via the data.error prop:
          // https://www.apollographql.com/docs/react/api/react-apollo.html#graphql-query-data-error
          console.error('Error while running `getDataFromTree`', error)
        }

        // getDataFromTree does not call componentWillUnmount
        // head side effect therefore need to be cleared manually
        Head.rewind()
      }

      // Extract query data from the Apollo's store
      const apolloState = apollo.cache.extract()
      //console.log(apolloState)
      return {
        ...appProps,
        apolloState
      }
    }

    constructor (props) {
      super(props)
      // `getDataFromTree` renders the component first, the client is passed off as a property.
      // After that rendering is done using Next's normal rendering pipeline
      //console.log('withApollo Constructed')
      this.apolloClient = initApollo(
          props.apolloState,
          { getToken: () => { return parseCookies().token } }
          )
    }

    render () {
      return <App {...this.props} apolloClient={this.apolloClient} />
    }
  }
}

