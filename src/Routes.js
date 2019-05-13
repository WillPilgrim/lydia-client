import React from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./containers/Home";
import Accounts from "./containers/Accounts";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import NewAccount from "./containers/NewAccount";
import NotFound from "./containers/NotFound";
import AppliedRoute from "./components/AppliedRoute";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";
import Settings from "./containers/Settings";
import Templates from "./containers/Templates";
import Template from "./containers/Template";
import Transactions from "./containers/Transactions";
import ResetPassword from "./containers/ResetPassword";
import ChangePassword from "./containers/ChangePassword";
import ChangeEmail from "./containers/ChangeEmail";

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Home} props={childProps} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <UnauthenticatedRoute path="/login/reset" exact component={ResetPassword} props={childProps} />
    <UnauthenticatedRoute path="/signup" exact component={Signup} props={childProps} />
    <AuthenticatedRoute path="/settings" exact component={Settings} props={childProps} />
    <AuthenticatedRoute path="/settings/password" exact component={ChangePassword} props={childProps} />
    <AuthenticatedRoute path="/settings/email" exact component={ChangeEmail} props={childProps} />
    <AuthenticatedRoute path="/accounts/new" exact component={NewAccount} props={childProps} />
    <AuthenticatedRoute path="/accounts/:id" exact component={Accounts} props={childProps} />
    <AuthenticatedRoute path="/templates/:id" exact component={Template} props={childProps} />
    <AuthenticatedRoute path="/templates" exact component={Templates} props={childProps} />
    <AuthenticatedRoute path="/transactions" exact component={Transactions} props={childProps} />
    { /* Finally, catch all unmatched routes */ }
    <Route component={NotFound} />
  </Switch>;
