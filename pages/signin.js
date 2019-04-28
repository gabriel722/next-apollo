import React from 'react'
import Link from 'next/link'

import redirect from '../lib/redirect'
import checkLoggedIn from '../lib/checkLoggedIn'

import SigninBox from '../components/SigninBox'

export default class Signin extends React.Component {

    //pages 에 속하므로 gIP 함수를 사용할 수 있다.
    //login이 되어있는지 확인하고, 되어 있다면, rendering 이전에 redirect 해야하므로 여기에 작성한다.
    static async getInitialProps (context) {

        console.log('Signin gIP works..')
        const { result } = await checkLoggedIn(context.apolloClient)

        if (result.loginCheck) {
            // 이미 로그인되어있다면, main page로 보낸다.
            console.log('Signin to Index')
            redirect(context, '/')
        }

        return {}
    }

    state = {
        testData: '',
        phoneNumber: '',
        smsNumber: ''
    }

    handlePhoneNumber = () => {
        fetch('http://115.68.220.123/todos', {
            body: JSON.stringify({'task': this.state.phoneNumber}),
            mode: 'cors',
            headers:{'Content-Type': 'application/json'},
            method:"POST"})

            .then(res => res.json())
            .then(data => {this.setState({smsNumber:data.task});console.log(this.state.smsNumber)})
            .then(err=> console.log(err))
    }

    handleSMStest = () => {
        fetch('http://127.0.0.1:5000/todos', {
            mode: 'cors',
            headers:{},
            method:"GET"})

            .then(res => res.json())
            .then(data => console.log(data))
            .then(err=> console.log(err))
    }

    handleState = (e) => {
        this.setState({phoneNumber: e.target.value})
    }

    render () {
        return (
            <React.Fragment>
                <SigninBox />
                <hr />
                New?{' '}
                <Link prefetch href='/create-account'>
                    <a>Create account</a>
                </Link>
                <div>
                    <input
                        value={this.state.phoneNumber}
                        onChange={this.handleState}
                    >
                        {console.log(this.state.phoneNumber)}
                    </input>
                    <button onClick={this.handlePhoneNumber}>
                        핸드폰 번호 전달
                    </button>
                    <input
                        value={this.state.smsNumber}
                        onChange={this.handleState}
                    >
                        {console.log(this.state.smsNumber)}
                    </input>
                    <button onClick={this.handleSMStest}>
                        인증번호
                    </button>
                </div>

            </React.Fragment>
        )
    }
}
