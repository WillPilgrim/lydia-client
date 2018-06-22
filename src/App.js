import React, { Component, Fragment } from "react";
import { Auth } from "aws-amplify";
import { Link, withRouter } from "react-router-dom";
import { Nav, Navbar, NavItem } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import Routes from "./Routes";
import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isAuthenticated: false,
      isAuthenticating: true,
      currentUser: "",
      accounts: null
    };
  }

  async componentDidMount() {
    try {
      if (await Auth.currentSession()) {
        const { attributes } = await Auth.currentUserInfo();
        this.userHasAuthenticated(true,attributes.email);
      }
    }
    catch (e) {
      if (e !== 'No current user') {
        alert(e);
      }
    }
    this.setState({ isAuthenticating: false });
  }

  userHasAuthenticated = (authenticated,user) => {
    this.setState({ isAuthenticated: authenticated });
    this.setState({ currentUser: user });
  }

  setAccounts = (setacc) => {
    console.log('Inside APP..before setting state to set accounts==>',this.state.accounts)
    this.setState({accounts:setacc})
    console.log('Inside APP..AFTER setting state to set accounts==>',this.state.accounts)
  }

  handleLogout = async event => {
    await Auth.signOut();

    this.userHasAuthenticated(false,"");

    this.props.history.push("/login");
  }

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
      setAccounts:this.setAccounts,
      accounts:this.state.accounts
    };

    return (
      !this.state.isAuthenticating &&
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
              {this.state.isAuthenticated
                ? <Fragment>
                  <LinkContainer to="/templates">
                    <NavItem>Templates</NavItem>
                  </LinkContainer>
                  <LinkContainer to="/settings">
                    <NavItem>{this.state.currentUser}</NavItem>
                  </LinkContainer>
                  <NavItem onClick={this.handleLogout}>Logout</NavItem>
                </Fragment>
                : <Fragment>
                  <LinkContainer to="/signup">
                    <NavItem>Signup</NavItem>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <NavItem>Login</NavItem>
                  </LinkContainer>
                </Fragment>
              }
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Routes childProps={childProps} />
      </div>
    );
  }
}

export default withRouter(App);
