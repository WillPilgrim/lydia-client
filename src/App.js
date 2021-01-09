
import React, { useState, useEffect } from "react"
import { useHistory } from "react-router-dom"
import Navbar from "react-bootstrap/Navbar"
import Nav from "react-bootstrap/Nav"
import Routes from "./Routes"
import { LinkContainer } from "react-router-bootstrap"
import { AppContext } from "./libs/contextLib"
import { onError } from "./libs/errorLib"
import { Auth } from "aws-amplify"
import { API } from "aws-amplify"
import "./App.css"

const App = () => {
  const history = useHistory()
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [isAuthenticated, userHasAuthenticated] = useState(false)
  const [stateToBeRefreshed, setStateToBeRefreshed] = useState(false)
  const [email, setEmail] = useState("Settings")
  const [templates, setTemplates] = useState(null)
  const [accounts, setAccounts] = useState(null)
  const [transAcc, setTransAcc] = useState(null)
  const [currentAccId, setCurrentAccId] = useState(0)
  const [templateFilterModel, setTemplateFilterModel] = useState(null)
  const [templateColumnState, setTemplateColumnState] = useState(null)
  const [saveArchiveRequired, setSaveArchiveRequired] = useState(false)
  const [saveRequired, setSaveRequired] = useState(false)
  const [recalcRequired, setRecalcRequired] = useState(false)
  const [archive, setArchive] = useState(false)

  useEffect(() => {
    console.log('App: useEffect')
    const onLoad = async () => {
      try {
        let session = await Auth.currentSession()
        userHasAuthenticated(true)
        console.log('Session:')
        console.log(session)
        if (session) {
          console.log('** > Before call to currentUserInfo')
          const { attributes } = await Auth.currentUserInfo()
          console.log('** > After call to currentUserInfo')
          setEmail(attributes.email)
        }
        await refreshAccounts()
        await refreshTemplates()
      }
      catch(e) {
        if (e !== 'No current user') {
          onError(e)
        }
      }
    
      setIsAuthenticating(false)
      setStateToBeRefreshed(false)
    }
    onLoad()
  }, [stateToBeRefreshed])
  


  const getAccounts = () => API.get("accounts", "/accounts")

  const getTemplates = () => API.get("accounts", "/templates")

  const refreshTemplates = async () => {
    const currentTemplates = await getTemplates()
    setTemplates( currentTemplates )
  }

  const refreshAccounts = async () => {
    const accountsFromGet = await getAccounts()
    const mappedAccounts = accountsFromGet.map(acc => {return {hide:false, ...acc}})
    sortAndSetAccounts(mappedAccounts)
  }

   const sortAndSetAccounts = accs => {
    accs.sort((a, b) => a.sortOrder - b.sortOrder)
    setAccounts(accs)
    const selectedAccount = accs.find(acc => !acc.hide)
    if (selectedAccount) {
     setCurrentAccId(selectedAccount.accountId)
    }
    else setCurrentAccId(0)
  }

  const changeAccountsOrder = (fromIndex, toIndex, fromSortOrder, toSortOrder) => {
    const localAccounts = accounts

    localAccounts[fromIndex].sortOrder = toSortOrder
    localAccounts[toIndex].sortOrder = fromSortOrder
    setRecalcRequired(true)
    sortAndSetAccounts(localAccounts)
  }

  const handleLogout = async () => {
    await Auth.signOut()

    userHasAuthenticated(false)

    history.push("/login")
  }

  const saveAccount= account => API.put("accounts", `/accounts/${account.accountId}`, {body: account})

  const saveAccountSet = async (fromIndex, toIndex) => {
    for (let i = fromIndex; i <= toIndex; i++)
    {
      await saveAccount(accounts[i])
    }
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
                <>
                  <LinkContainer to="/accounts">
                    <Nav.Link>Accounts</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/transactions">
                    <Nav.Link>Transactions</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/templates">
                    <Nav.Link>Templates</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/settings">
                    <Nav.Link>{email}</Nav.Link>
                  </LinkContainer>
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
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
        <AppContext.Provider value={{ 
          isAuthenticated, userHasAuthenticated, accounts, templates, transAcc, refreshTemplates, refreshAccounts, currentAccId, setCurrentAccId, 
          templateColumnState, templateFilterModel, setTemplateColumnState, setTemplateFilterModel, setRecalcRequired,
          setStateToBeRefreshed, changeAccountsOrder, saveAccountSet,
          archive, setSaveArchiveRequired, setTransAcc, setSaveRequired,
          setArchive
        }}>
          <Routes />
        </AppContext.Provider>
      </div>
    )
  )
}

export default App