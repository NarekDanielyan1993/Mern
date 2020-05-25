import React, { Component, Fragment } from 'react';
import { Route, Switch, Redirect, withRouter } from 'react-router-dom';

import Layout from './components/Layout/Layout';
import Backdrop from './components/Backdrop/Backdrop';
import Toolbar from './components/Toolbar/Toolbar';
import MainNavigation from './components/Navigation/MainNavigation/MainNavigation';
import MobileNavigation from './components/Navigation/MobileNavigation/MobileNavigation';
import ErrorHandler from './components/ErrorHandler/ErrorHandler';
import FeedPage from './pages/Feed/Feed';
import SinglePostPage from './pages/Feed/SinglePost/SinglePost';
import LoginPage from './pages/Auth/Login';
import SignupPage from './pages/Auth/Signup';
import axios from "./util/axiosConfig";
import './App.css';

class App extends Component {
  state = {
    showBackdrop: false,
    showMobileNav: false,
    isAuth: false,
    token: null,
    userId: null,
    authLoading: false,
    error: null
  };

  componentDidMount() {
    const token = localStorage.getItem('token');
    const expiryDate = localStorage.getItem('expiryDate');
    if (!token || !expiryDate) {
      return;
    }
    if (new Date(expiryDate) <= new Date()) {
      this.logoutHandler();
      return;
    }
    const userId = localStorage.getItem('userId');
    const remainingMilliseconds =
    new Date(expiryDate).getTime() - new Date().getTime();
    this.setState({ isAuth: true, token: token, userId: userId });
    this.setAutoLogout(remainingMilliseconds);
  }

  mobileNavHandler = isOpen => {
    this.setState({ showMobileNav: isOpen, showBackdrop: isOpen });
  };
  
  backdropClickHandler = () => {
    this.setState({ showBackdrop: false, showMobileNav: false, error: null });
  };

  logoutHandler = () => {
    this.setState({ isAuth: false, token: null });
    localStorage.removeItem('token');
    localStorage.removeItem('expiryDate');
    localStorage.removeItem('userId');
  };

  loginHandler = (event, authData) => {
    console.log(authData);
    event.preventDefault();
    this.setState({ authLoading: true });
    axios({method: "POST", url: "/auth/login", data: {
      email: authData.email, 
      password: authData.password
    }})
      .then(res => {
        return res.data;
      })
      .then(resData => {
        this.setState({
          isAuth: true,
          token: resData.token,
          authLoading: false,
          userId: resData.userId
        });
        const remainingMilliseconds = 60 * 60 * 1000;
        const expiryDate = new Date(
          new Date().getTime() + remainingMilliseconds
        );
        localStorage.setItem('token', resData.token);
        localStorage.setItem('userId', resData.userId);    
        localStorage.setItem('expiryDate', expiryDate.toISOString());
        this.setAutoLogout(remainingMilliseconds);
      })
      .catch(err => {
        if(err.response) {
          console.log(err.response);
          this.setState({
            isAuth: false,
            authLoading: false,
            error: err.response.data.message
          });
        } else if(err.request){
          console.log(err.request)
        } else {
          console.log(err)
        }
        
      });
  };

  signupHandler = (event, authData) => {
    console.log(authData)
    event.preventDefault();
    this.setState({ authLoading: true });
    axios({method: "PUT", url: "/auth/signup", data: {
      email: authData.signupForm.email.value,
      name:  authData.signupForm.name.value,
      password: authData.signupForm.password.value,
      passwordConformation: authData.signupForm.passwordConformation.value
    }})
    .then(res => {
      console.log(res.data);
      return res.data;
    })
    .then(resData => {
      console.log(resData);
      this.setState({ isAuth: false, authLoading: false });
      this.props.history.replace('/');
    })
    .catch(err => {
      if(err.response) {
        console.log(err.response.data);
        this.setState({
          isAuth: false,
          authLoading: false,
          error: err.response.data.message
        })
      } else if(err.request){
        console.log(err.request)
      } else {
        console.log(err)
      }
    });
  };

  setAutoLogout = milliseconds => {
    setTimeout(() => {
      this.logoutHandler();
    }, milliseconds);
  };

  errorHandler = () => {
    this.setState({ error: null });
  };

  render() {
    let routes = (
      <Switch>
        <Route
          path="/"
          exact
          render={props => (
            <LoginPage
              {...props}
              onLogin={this.loginHandler}
              loading={this.state.authLoading}
            />
          )}
        />
        <Route
          path="/signup"
          exact
          render={props => (
            <SignupPage
              {...props}
              onSignup={this.signupHandler}
              loading={this.state.authLoading}
            />
          )}
        />
        <Redirect to="/" />
      </Switch>
    );
    if (this.state.isAuth) {
      routes = (
        <Switch>
          <Route
            path="/"
            exact
            render={props => (
              <FeedPage userId={this.state.userId} token={this.state.token} />
            )}
          />
          <Route
            path="/:postId"
            render={props => (
              <SinglePostPage
                {...props}
                userId={this.state.userId}
                token={this.state.token}
              />
            )}
          />
          <Redirect to="/" />
        </Switch>
      );
    }
    return (
      <Fragment>
        {this.state.showBackdrop && (
          <Backdrop onClick={this.backdropClickHandler} />
        )}
        <ErrorHandler error={this.state.error} onHandle={this.errorHandler} />
        <Layout
          header={
            <Toolbar>
              <MainNavigation
                onOpenMobileNav={this.mobileNavHandler.bind(this, true)}
                onLogout={this.logoutHandler}
                isAuth={this.state.isAuth}
              />
            </Toolbar>
          }
          mobileNav={
            <MobileNavigation
              open={this.state.showMobileNav}
              mobile
              onChooseItem={this.mobileNavHandler.bind(this, false)}
              onLogout={this.logoutHandler}
              isAuth={this.state.isAuth}
            />
          }
        />
        {routes}
      </Fragment>
    );
  }
}

export default withRouter(App);




