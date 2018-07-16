import React, { Component, Fragment } from "react";
import { Auth } from "aws-amplify";
import { Link, withRouter } from "react-router-dom";
import { Nav, Navbar, NavItem } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import Routes from "./Routes";
import "./App.css";
import { API } from "aws-amplify";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isAuthenticating: true,
      currentUser: "",
      accounts: null,
      currentAccId: null,
      transAcc: null,
      templates: null,
      recalcRequired: false,
      saveRequired: false
    };
  }

  async componentDidMount() {
    try {
      if (await Auth.currentSession()) {
        const { attributes } = await Auth.currentUserInfo();
        this.userHasAuthenticated(true, attributes.email);
      }
      await this.refreshAccounts();
      await this.refreshTemplates();
    } catch (e) {
      if (e !== "No current user") {
        alert(e);
      }
    }

    this.setState({ isAuthenticating: false });
  }

  userHasAuthenticated = (authenticated, user) => {
    this.setState({ isAuthenticated: authenticated });
    this.setState({ currentUser: user });
  };

  clearState = () => {
    this.userHasAuthenticated(false, "");
    this.setState({
      accounts: null,
      currentAccId: null,
      transAcc: null,
      templates: null,
      recalcRequired: false,
      saveRequired: false
    })
  }

  getAccounts() {
    return API.get("accounts", "/accounts");
  }

  getTemplates() {
    return API.get("accounts", "/templates");
  }

  refreshTemplates = async () => {
    const templates = await this.getTemplates();
    this.setState({ templates });
  };

  refreshAccounts = async () => {
    const accounts = await this.getAccounts();
    this.setState({ accounts });
    if (accounts.length) this.setCurrentAccId(accounts[0].accountId);
  };

  setTransactions = transAcc => this.setState({ transAcc })

  setCurrentAccId = accId => this.setState({ currentAccId: accId });

  setRecalcRequired = recalc => this.setState({recalcRequired: recalc})

  setSaveRequired = save => this.setState({saveRequired: save})

  handleLogout = async event => {
    await Auth.signOut();
    this.clearState();
    this.props.history.push("/login");
  };

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
      accounts: this.state.accounts,
      templates: this.state.templates,
      refreshAccounts: this.refreshAccounts,
      refreshTemplates: this.refreshTemplates,
      currentAccId: this.state.currentAccId,
      setCurrentAccId: this.setCurrentAccId,
      setTransactions: this.setTransactions,
      setRecalcRequired: this.setRecalcRequired,
      setSaveRequired: this.setSaveRequired,
      transAcc: this.state.transAcc,
      recalcRequired: this.state.recalcRequired,
      saveRequired: this.state.saveRequired
    };

    return (
      !this.state.isAuthenticating && (
        <div className="App container">
          <Navbar fluid collapseOnSelect>
            <Navbar.Header>
              <Navbar.Brand>
                <Link to="/">Lydia</Link>
              </Navbar.Brand>
              <Navbar.Toggle />
            </Navbar.Header>
            <Navbar.Collapse>
              <Nav pullRight>
                {this.state.isAuthenticated ? (
                  <Fragment>
                    <LinkContainer to="/transactions">
                      <NavItem>Transactions</NavItem>
                    </LinkContainer>
                    <LinkContainer to="/templates">
                      <NavItem>Templates</NavItem>
                    </LinkContainer>
                    <LinkContainer to="/settings">
                      <NavItem>{this.state.currentUser}</NavItem>
                    </LinkContainer>
                    <NavItem onClick={this.handleLogout}>Logout</NavItem>
                  </Fragment>
                ) : (
                    <Fragment>
                      <LinkContainer to="/signup">
                        <NavItem>Signup</NavItem>
                      </LinkContainer>
                      <LinkContainer to="/login">
                        <NavItem>Login</NavItem>
                      </LinkContainer>
                    </Fragment>
                  )}
              </Nav>
            </Navbar.Collapse>
          </Navbar>
          <Routes childProps={childProps} />
        </div>
      )
    );
  }
}

export default withRouter(App);
