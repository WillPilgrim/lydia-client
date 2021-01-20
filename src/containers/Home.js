import React, { useState, useEffect } from "react"
import ListGroup from "react-bootstrap/ListGroup"
import { BsCreditCard } from "react-icons/bs"
import { LinkContainer } from "react-router-bootstrap"
import { Link } from "react-router-dom"
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import { API } from "aws-amplify"
import "./Home.css"

const Home = () => {

  const [accounts, setAccounts] = useState([])
  const { isAuthenticated } = useAppContext()
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    console.log('Home: useEffect')

      const loadAccounts = () => API.get("accounts", "/accounts")
      
      const onLoad = async () => {
      if (!isAuthenticated) {
        return
      }
  
      try {
        const accounts = await loadAccounts()
        setAccounts(accounts)
      } catch (e) {
        onError(e)
      }
  
      setIsLoading(false)
    }
  
    onLoad()
  }, [isAuthenticated])

  const renderAccountsList = accounts => 
    <>
      <LinkContainer to="/accounts/new">
        <ListGroup.Item action className="py-3 text-nowrap text-truncate">
          <BsCreditCard size={17} />
          <span className="ml-2 font-weight-bold">Create a new account</span>
        </ListGroup.Item>
      </LinkContainer>
      {accounts.map(({ accountId, accName }) => (
        <LinkContainer key={accountId} to={`/accounts/${accountId}`}>
          <ListGroup.Item action>
            <span className="font-weight-bold">
              {accName.trim().split("\n")[0]}
            </span>
          </ListGroup.Item>
        </LinkContainer>
      ))}
    </>

  const renderLander = () =>
    <div className="lander">
      <h1>Lydia</h1>
      <p className="text-muted">Take control of your money</p>
      <div className="pt-3">
        <Link to="/login" className="btn btn-info btn-lg mr-3">
          Login
        </Link>
        <Link to="/signup" className="btn btn-success btn-lg">
          Signup
        </Link>
      </div>
    </div>

  const renderAccounts = () =>
    <div className="accounts">
      <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Accounts</h2>
      <ListGroup>{!isLoading && renderAccountsList(accounts)}</ListGroup>
    </div>

  return (
    <div className="Home">
      {isAuthenticated ? renderAccounts() : renderLander()}
    </div>
  )
}

export default Home