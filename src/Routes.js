import React from "react"
import { Route, Switch } from "react-router-dom"
import Home from "./containers/Home"
import NotFound from "./containers/NotFound"
import Login from "./containers/Login"
import Signup from "./containers/Signup"
import Settings from "./containers/Settings"
import ResetPassword from "./containers/ResetPassword"
import AuthenticatedRoute from "./components/AuthenticatedRoute"
import UnauthenticatedRoute from "./components/UnauthenticatedRoute"
import Account from "./containers/Account"
import Accounts from "./containers/Accounts"
import Templates from "./containers/Templates"
import Template from "./containers/Template"
import Transactions from "./containers/Transactions"

// import ChangePassword from "./containers/ChangePassword";
// import ChangeEmail from "./containers/ChangeEmail";

const Routes = () =>
  <Switch>
    <Route exact path="/">
      <Home />
    </Route>
    <UnauthenticatedRoute exact path="/login">
      <Login />
    </UnauthenticatedRoute>
    <UnauthenticatedRoute exact path="/login/reset">
      <ResetPassword />
    </UnauthenticatedRoute>
    <UnauthenticatedRoute exact path="/signup">
      <Signup />
    </UnauthenticatedRoute>
    <AuthenticatedRoute exact path="/settings">
      <Settings />
    </AuthenticatedRoute>
    <AuthenticatedRoute exact path="/accounts">
      <Accounts />
    </AuthenticatedRoute>
    <AuthenticatedRoute exact path="/accounts/:id">
      <Account />
    </AuthenticatedRoute>
    <AuthenticatedRoute exact path="/templates">
      <Templates />
    </AuthenticatedRoute>
    <AuthenticatedRoute exact path="/templates/:id">
      <Template />
    </AuthenticatedRoute>
    <AuthenticatedRoute exact path="/transactions">
      <Transactions />
    </AuthenticatedRoute>
    {/* 
    <AuthenticatedRoute path="/settings/password" exact component={ChangePassword} props={childProps} />
    <AuthenticatedRoute path="/settings/email" exact component={ChangeEmail} props={childProps} />
    { /* Finally, catch all unmatched routes */ }
    <Route>
      <NotFound />
    </Route>
  </Switch>

export default Routes