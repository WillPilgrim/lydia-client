import React, { useState, useEffect } from "react"
import { API } from "aws-amplify"
import { useHistory } from "react-router-dom"
import { Elements, StripeProvider } from "react-stripe-elements"
import { LinkContainer } from "react-router-bootstrap"
import Form from "react-bootstrap/Form"
import { onError } from "../libs/errorLib"
import BillingForm from "../components/BillingForm"
import LoaderButton from "../components/LoaderButton"
import config from "../config"
import "./Settings.css"

const Settings = () => {
  const history = useHistory()
  const [isLoading, setIsLoading] = useState(false)
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    console.log('Settings: useEffect')

    setStripe(window.Stripe(config.STRIPE_KEY))
  }, [])

  const billUser = details => API.post("accounts", "/billing", { body: details })

  const handleFormSubmit = async (accounts, { token, error }) => {
    if (error) {
      onError(error)
      return
    }
  
    setIsLoading(true)
  
    try {
      await billUser({
        accounts,
        source: token.id
      })
  
      alert("Your card has been charged successfully!")
      history.push("/")
    } catch (e) {
      onError(e)
      setIsLoading(false)
    }
  }
  

  return (
    <div className="Settings">
      <Form.Label>Security</Form.Label>
      <LinkContainer to="/settings/email">
        <LoaderButton
          block
          size="lg">
            Change Email
        </LoaderButton>
      </LinkContainer>
      <LinkContainer to="/settings/password">
        <LoaderButton
          block
          size="lg">
           Change Password
        </LoaderButton>
      </LinkContainer>      
      <hr />
      <StripeProvider stripe={stripe}>
        <Elements
          fonts={[
            {
              cssSrc:
                "https://fonts.googleapis.com/css?family=Open+Sans:300,400,600,700,800"
            }
          ]}
        >
          <BillingForm isLoading={isLoading} onSubmit={handleFormSubmit} />
        </Elements>
      </StripeProvider>
    </div>
  )
}

export default Settings