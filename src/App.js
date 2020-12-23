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
      saveRequired: false,
      saveArchiveRequired: false,
      archive: false
    };
  }

  async componentDidMount() {
    try {
      let session = await Auth.currentSession()
      console.log('Session:')
      console.log(session)
      if (session) {
        console.log('** > Before call to currentUserInfo')
        const { attributes } = await Auth.currentUserInfo();
        console.log('** > After call to currentUserInfo')
        this.userHasAuthenticated(true, attributes.email);
      }
      await this.refreshAccounts();
      await this.refreshTemplates();
    } catch (e) {
      if (e !== "No current user") {
        console.log('SOMETHING WRONG WITH SIGN IN - MAYBE REFRESH TOKEN EXPIRED')
        console.log(e)
        console.log('==========================================================')
        // need to handle case where refresh token expired!
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
      saveRequired: false,
      saveArchiveRequired: false,
      archive: false
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
    const accountsFromGet = await this.getAccounts()
    // added to insert new 'hide' value
    const accounts = accountsFromGet.map(acc => {return {hide:false, ...acc}})
    this.sortAndSetAccounts(accounts);
  };

  sortAndSetAccounts = accounts => {
    accounts.sort((a, b) => a.sortOrder - b.sortOrder)
    this.setState({ accounts })
    const selectedAccount = accounts.find(acc => !acc.hide)
    if (selectedAccount) this.setCurrentAccId(selectedAccount.accountId)
    else this.setCurrentAccId(0)
  }

  moveAccounts = async (i, dir) => {
    const accounts = this.state.accounts
    const fromAcc = accounts[i-1]
    const toAcc = accounts[dir === "U"?i-2:i]
    const fromSort = fromAcc.sortOrder
    const toSort = toAcc.sortOrder
    fromAcc.sortOrder = toSort;
    toAcc.sortOrder = fromSort;
    this.setRecalcRequired(true)

    await this.saveAccount(fromAcc);
    await this.saveAccount(toAcc);
    this.sortAndSetAccounts(accounts);
  }

  saveAccount(account) {
    return API.put("accounts", `/accounts/${account.accountId}`, {
      body: account
    });
  }

  setTransactions = transAcc => this.setState({ transAcc })

  setCurrentAccId = accId => this.setState({ currentAccId: accId });

  setRecalcRequired = recalc => this.setState({recalcRequired: recalc})

  setSaveRequired = save => this.setState({saveRequired: save})

  setSaveArchiveRequired = save => this.setState({saveArchiveRequired: save})

  setArchive = archive => this.setState({archive})

  handleLogout = async event => {
    await Auth.signOut();
    this.clearState();
    this.props.history.push("/login");
  };

  render() {
    const childProps = {
      userHasAuthenticated: this.userHasAuthenticated,
      refreshAccounts: this.refreshAccounts,
      moveAccounts: this.moveAccounts,
      refreshTemplates: this.refreshTemplates,
      setCurrentAccId: this.setCurrentAccId,
      setTransactions: this.setTransactions,
      setRecalcRequired: this.setRecalcRequired,
      setSaveRequired: this.setSaveRequired,
      setSaveArchiveRequired: this.setSaveArchiveRequired,
      setArchive: this.setArchive,
      currentAccId: this.state.currentAccId,
      isAuthenticated: this.state.isAuthenticated,
      accounts: this.state.accounts,
      templates: this.state.templates,
      transAcc: this.state.transAcc,
      recalcRequired: this.state.recalcRequired,
      saveRequired: this.state.saveRequired,
      saveArchiveRequired: this.state.saveArchiveRequired,
      archive: this.state.archive
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
                    <LinkContainer to="/accounts">
                      <NavItem>Accounts</NavItem>
                    </LinkContainer>
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
