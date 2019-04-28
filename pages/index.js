import React from 'react'
import cookie from 'cookie'
import { ApolloConsumer } from 'react-apollo'

import redirect from '../lib/redirect'
import checkLoggedIn from '../lib/checkLoggedIn'
import PropTypes from "prop-types";

export default class Index extends React.Component {

  static propTypes = {
    result: PropTypes.object
  }

  //pages 에 속하므로 gIP 함수를 사용할 수 있다.
  //login이 되어있는지 확인하고, 되어 있지 않다면, rendering 이전에 redirect 해야하므로 여기에 작성한다.
  static async getInitialProps (context) {

    console.log('Index gIP works..')
    const { result } = await checkLoggedIn(context.apolloClient)

    if (!result.loginCheck) {
      //로그인을 위한 페이지로 보낸다.
      console.log('Index to Signin')
      redirect(context, '/signin')
    }

    return { result }
  }

  signout = apolloClient => () => {
    console.log(document.cookie)
    document.cookie = cookie.serialize('token', '', {
      maxAge: -1 // Expire the cookie immediately
    })

    // Force a reload of all the current queries now that the user is logged in,
    // so we don't accidentally leave any state around.
    apolloClient.cache.reset().then(() => {
      redirect({}, '/signin')
    })
  }

  render () {
    const { result } = this.props
    return (
      <ApolloConsumer>
        {client => (
          <div>
            Hello {result.loginCheck.name}!<br />
            <button onClick={this.signout(client)}>Sign out</button>
          </div>
        )}
      </ApolloConsumer>
    )
  }
}
