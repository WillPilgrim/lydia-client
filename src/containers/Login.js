import React, { useState } from "react"
import { Auth } from "aws-amplify"
import Form from "react-bootstrap/Form"
import { Link } from "react-router-dom"
import LoaderButton from "../components/LoaderButton"
import ConfirmationCode from "../components/ConfirmationCode"
import { useAppContext } from "../libs/contextLib"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import "./Login.css"

const Login = () => {

  const { setStateToBeRefreshed } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)
  const [displayConfirmationForm, setDisplayConfirmationForm] = useState(false)
  const [fields, handleFieldChange, setSomeFields] = useFormFields({
    email: "",
    password: "",
  })

  const validateForm = () => fields.email.length > 0 && fields.password.length > 0

  const handleSubmit = async event => {
    event.preventDefault()

    setIsLoading(true)

    try {
      await Auth.signIn(fields.email, fields.password)
      setStateToBeRefreshed( value => !value)
    } catch (e) {
      if (e.name === "UserNotConfirmedException") {
        try {
          await Auth.resendSignUp(fields.email.toLowerCase())
          alert(`User ${fields.email.toLowerCase()} has not been confirmed. Check email for new confirmation code.`)
          setDisplayConfirmationForm(true)
        }
        catch (resendErr)
        {
          onError(resendErr)          
        }
      }
      else
        onError(e)
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleConfirmationSubmit = async confirmationCode => {

    setIsLoading(true)

    try {
      await Auth.confirmSignUp(fields.email.toLowerCase(), confirmationCode)
      await Auth.signIn(fields.email.toLowerCase(), fields.password)
      setStateToBeRefreshed(value => !value)
    } catch (e) {
      if (e.code === "NotAuthorizedException") {
        setSomeFields({ password:"" })
        alert(`User ${fields.email.toLowerCase()} confirmed but incorrect password provided. Try again.`)
        setDisplayConfirmationForm(false)
      } 
      else 
        onError(e)
    }
    finally {
      setIsLoading(false)
    }
  }

  const renderForm = () =>  {
    return (
      <Form onSubmit={handleSubmit}>
        <Form.Group size="lg" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            autoFocus
            type="email"
            value={fields.email}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group size="lg" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={fields.password}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Link to="/login/reset">Forgot password?</Link>
        <LoaderButton
          block
          size="lg"
          type="submit"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Login
        </LoaderButton>
      </Form>
    )
  }

  return (
    <div className="Login">
      {displayConfirmationForm ? 
        <ConfirmationCode onSubmit={handleConfirmationSubmit} isLoading={isLoading} /> 
        : renderForm() }
    </div>
  )
}

export default Login