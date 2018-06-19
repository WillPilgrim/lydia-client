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

export default ({ childProps }) =>
  <Switch>
    <AppliedRoute path="/" exact component={Home} props={childProps} />
    <UnauthenticatedRoute path="/login" exact component={Login} props={childProps} />
    <UnauthenticatedRoute path="/signup" exact component={Signup} props={childProps} />
    <AuthenticatedRoute path="/settings" exact component={Settings} props={childProps} />
    <AuthenticatedRoute path="/accounts/new" exact component={NewAccount} props={childProps} />
    <AuthenticatedRoute path="/accounts/:id" exact component={Accounts} props={childProps} />
    <AuthenticatedRoute path="/templates" exact component={Templates} props={childProps} />
    { /* Finally, catch all unmatched routes */ }
    <Route component={NotFound} />
  </Switch>;
