import { Mutation, withApollo } from 'react-apollo'
import gql from 'graphql-tag'
import cookie from 'cookie'
import redirect from '../lib/redirect'

const SIGN_IN = gql`
  mutation Signin($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`

const SigninBox = ({ client }) => {
  let e_mail, pass_word

  return (
    <Mutation
      mutation={SIGN_IN}
      onCompleted={data => {
        // Store the token in cookie
        document.cookie = cookie.serialize('token', data.login.token, {
          maxAge: 30 * 24 * 60 * 60 // 30 days
        })
        // Force a reload of all the current queries now that the user is
        // logged in
        client.cache.reset().then(() => {
          redirect({}, '/')
        })
      }}
      onError={error => {
        // If you want to send error to external service?
        console.log(error)
      }}
    >
      {(login, { data, error }) => (
        <form
          onSubmit={e => {
            e.preventDefault()
            e.stopPropagation()

            login({
              variables: {
                email: e_mail.value,
                password: pass_word.value
              }
            })

            e_mail.value = pass_word.value = ''
          }}
        >
          {error && <p>No user found with that information.</p>}
          <input
            name='e_mail'
            placeholder='Email'
            ref={ node1 => { e_mail = node1 } }
          />
          <br />
          <input
            name='pass_word'
            placeholder='Password'
            ref={ node2 => { pass_word = node2 } }
            type='password'
          />
          <br />
          <button>Sign in</button>
        </form>
      )}
    </Mutation>
  )
}

export default withApollo(SigninBox)
