import React, { useState, useEffect } from "react"
import { useHistory } from "react-router-dom"
import Navbar from "react-bootstrap/Navbar"
import Nav from "react-bootstrap/Nav"
import Routes from "./Routes"
import { LinkContainer } from "react-router-bootstrap"
import { AppContext } from "./libs/contextLib"
import { onError } from "./libs/errorLib"
import { Auth } from "aws-amplify"
import "./App.css"
// import au from 'date-fns/locale/en-AU';
// import { registerLocale, setDefaultLocale } from "react-datepicker";

export default () => {
  const history = useHistory()
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isAuthenticated, userHasAuthenticated] = useState(false)

  useEffect(() => {
    // registerLocale('en-AU', au)
    // setDefaultLocale('en-AU')
    onLoad()
  }, [])
  
  const onLoad = async () => {
    try {
      await Auth.currentSession()
      userHasAuthenticated(true)
    }
    catch(e) {
      if (e !== 'No current user') {
        onError(e)
      }
    }
  
    setIsAuthenticating(false)
  }

  const handleLogout = async () => {
    await Auth.signOut()

    userHasAuthenticated(false)

    history.push("/login")
  }

  return (
    !isAuthenticating && (
      <div className="App container py-3">
        <Navbar collapseOnSelect bg="light" expand="md" className="mb-3">
          <LinkContainer to="/">
            <Navbar.Brand className="font-weight-bold text-muted">
              Lydia
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav activeKey={window.location.pathname}>
              {isAuthenticated ? (
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
              ) : (
                <>
                  <LinkContainer to="/signup">
                    <Nav.Link>Signup</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <Nav.Link>Login</Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated }}>
          <Routes />
        </AppContext.Provider>
      </div>
    )
  )
}

// import React, { Component, Fragment } from "react";
// import { Auth } from "aws-amplify";
// import { Link, withRouter } from "react-router-dom";
// import Navbar from "react-bootstrap/Navbar"
// import Nav from "react-bootstrap/Nav"
// import { LinkContainer } from "react-router-bootstrap";
// import Routes from "./Routes";
// import "./App.css";
// import { API } from "aws-amplify";

// class App extends Component {
//   constructor(props) {
//     super(props);

//     this.state = {
//       isAuthenticated: false,
//       isAuthenticating: true,
//       currentUser: "",
//       accounts: null,
//       currentAccId: null,
//       transAcc: null,
//       templates: null,
//       recalcRequired: false,
//       saveRequired: false,
//       saveArchiveRequired: false,
//       archive: false
//     };
//   }

//   async componentDidMount() {
//     try {
//       let session = await Auth.currentSession()
//       console.log('Session:')
//       console.log(session)
//       if (session) {
//         console.log('** > Before call to currentUserInfo')
//         const { attributes } = await Auth.currentUserInfo();
//         console.log('** > After call to currentUserInfo')
//         this.userHasAuthenticated(true, attributes.email);
//       }
//       await this.refreshAccounts();
//       await this.refreshTemplates();
//     } catch (e) {
//       if (e !== "No current user") {
//         console.log('SOMETHING WRONG WITH SIGN IN - MAYBE REFRESH TOKEN EXPIRED')
//         console.log(e)
//         console.log('==========================================================')
//         // need to handle case where refresh token expired!
//         alert(e);
//       }
//     }

//     this.setState({ isAuthenticating: false });
//   }

//   userHasAuthenticated = (authenticated, user) => {
//     this.setState({ isAuthenticated: authenticated });
//     this.setState({ currentUser: user });
//   };

//   clearState = () => {
//     this.userHasAuthenticated(false, "");
//     this.setState({
//       accounts: null,
//       currentAccId: null,
//       transAcc: null,
//       templates: null,
//       recalcRequired: false,
//       saveRequired: false,
//       saveArchiveRequired: false,
//       archive: false,
//       templateColumnState: null,
//       templateFilterModel: null
//     })
//   }

//   getAccounts() {
//     return API.get("accounts", "/accounts");
//   }

//   getTemplates() {
//     return API.get("accounts", "/templates");
//   }

//   refreshTemplates = async () => {
//     const templates = await this.getTemplates();
//     this.setState({ templates });
//   };

//   refreshAccounts = async () => {
//     const accountsFromGet = await this.getAccounts()
//     // added to insert new 'hide' value
//     const accounts = accountsFromGet.map(acc => {return {hide:false, ...acc}})
//     this.sortAndSetAccounts(accounts);
//   };

//   sortAndSetAccounts = accounts => {
// //    accounts.forEach(x => console.log(`Name=${x.accName} sortOrder=${x.sortOrder}`))
//     accounts.sort((a, b) => a.sortOrder - b.sortOrder)
//     this.setState({ accounts })
//     const selectedAccount = accounts.find(acc => !acc.hide)
//     if (selectedAccount) this.setCurrentAccId(selectedAccount.accountId)
//     else this.setCurrentAccId(0)
//   }

//   changeAccountsOrder = (fromIndex, toIndex, fromSortOrder, toSortOrder) => {
//     const accounts = this.state.accounts

//     accounts[fromIndex].sortOrder = toSortOrder
//     accounts[toIndex].sortOrder = fromSortOrder
// //    console.log(`fromIndex=${fromIndex}, toIndex=${toIndex}, fromSortOrderr=${fromSortOrder}, toSortOrder.sortOrder=${toSortOrder}`)

//     this.setRecalcRequired(true)
//     this.sortAndSetAccounts(accounts)
//   }

//   saveAccount= account => {
//     return API.put("accounts", `/accounts/${account.accountId}`, {
//       body: account
//     });
//   }

//   saveAccountSet = async (fromIndex, toIndex) => {
//     for (let i = fromIndex; i <= toIndex; i++)
//     {
//       let account = this.state.accounts[i]
// //      console.log(`${i} ${account.accName}`)
//       await this.saveAccount(account)
//     }
//   }

//   setTransactions = transAcc => this.setState({ transAcc })

//   setCurrentAccId = accId => this.setState({ currentAccId: accId });

//   setRecalcRequired = recalc => this.setState({recalcRequired: recalc})

//   setSaveRequired = save => this.setState({saveRequired: save})

//   setSaveArchiveRequired = save => this.setState({saveArchiveRequired: save})

//   setArchive = archive => this.setState({archive})

//   setTemplateColumnState = colState => this.setState({templateColumnState: colState })

//   setTemplateFilterModel = model => this.setState({templateFilterModel: model })

//   handleLogout = async event => {
//     await Auth.signOut();
//     this.clearState();
//     this.props.history.push("/login");
//   };

//   render() {
//     const childProps = {
//       userHasAuthenticated: this.userHasAuthenticated,
//       refreshAccounts: this.refreshAccounts,
//       refreshTemplates: this.refreshTemplates,
//       setCurrentAccId: this.setCurrentAccId,
//       setTransactions: this.setTransactions,
//       setRecalcRequired: this.setRecalcRequired,
//       setSaveRequired: this.setSaveRequired,
//       setSaveArchiveRequired: this.setSaveArchiveRequired,
//       setArchive: this.setArchive,
//       setTemplateColumnState: this.setTemplateColumnState,
//       setTemplateFilterModel: this.setTemplateFilterModel,
//       changeAccountsOrder: this.changeAccountsOrder,
//       saveAccountSet: this.saveAccountSet,
//       currentAccId: this.state.currentAccId,
//       isAuthenticated: this.state.isAuthenticated,
//       accounts: this.state.accounts,
//       templates: this.state.templates,
//       transAcc: this.state.transAcc,
//       recalcRequired: this.state.recalcRequired,
//       saveRequired: this.state.saveRequired,
//       saveArchiveRequired: this.state.saveArchiveRequired,
//       archive: this.state.archive,
//       templateColumnState: this.state.templateColumnState,
//       templateFilterModel: this.state.templateFilterModel
//     };

//     return (
//       !this.state.isAuthenticating && (
//         <div className="App container py-3">
//           <Navbar collapseOnSelect bg="light" expand="md" className="mb-3">
//             <LinkContainer to="/">
//               <Navbar.Brand className="font-weight-bold text-muted">
//                 {/* <Link to="/">Lydia</Link> */}
//                 Lydia
//             </Navbar.Brand>
//             </LinkContainer>
//             <Navbar.Toggle />
//             <Navbar.Collapse className="justify-content-end">
//               <Nav activeKey={window.location.pathname}>
//                 <LinkContainer to="/signup">
//                   <Nav.Link>Signup</Nav.Link>
//                 </LinkContainer>
//                 <LinkContainer to="/login">
//                   <Nav.Link>Login</Nav.Link>
//                 </LinkContainer>
//                 {/* {this.state.isAuthenticated ? (
//                   <Fragment>
//                     <LinkContainer to="/accounts">
//                       <NavItem>Accounts</NavItem>
//                     </LinkContainer>
//                     <LinkContainer to="/transactions">
//                       <NavItem>Transactions</NavItem>
//                     </LinkContainer>
//                     <LinkContainer to="/templates">
//                       <NavItem>Templates</NavItem>
//                     </LinkContainer>
//                     <LinkContainer to="/settings">
//                       <NavItem>{this.state.currentUser}</NavItem>
//                     </LinkContainer>
//                     <NavItem onClick={this.handleLogout}>Logout</NavItem>
//                   </Fragment>
//                 ) : (
//                     <Fragment>
//                       <LinkContainer to="/signup">
//                         <NavItem>Signup</NavItem>
//                       </LinkContainer>
//                       <LinkContainer to="/login">
//                         <NavItem>Login</NavItem>
//                       </LinkContainer>
//                     </Fragment>
//                   )} */}
//               </Nav>
//             </Navbar.Collapse>
//           </Navbar>
//           <Routes childProps={childProps} />
//         </div>
//       )
//     );
//   }
// }

// export default withRouter(App);
