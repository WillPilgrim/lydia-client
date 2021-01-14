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

  const { userHasAuthenticated, refreshAccounts, refreshTemplates, setStateToBeRefreshed } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)
  const [displayConfirmationForm, setDisplayConfirmationForm] = useState(false)
  const [fields, handleFieldChange, setSomeFields] = useFormFields({
    email: "",
    password: "",
    // confirmationCode: ""
  })

  const validateForm = () => fields.email.length > 0 && fields.password.length > 0

  const handleSubmit = async event => {
    event.preventDefault()

    setIsLoading(true)

    try {
      await Auth.signIn(fields.email, fields.password)
      setStateToBeRefreshed(true)
      // await refreshAccounts()
      // await refreshTemplates()
      // userHasAuthenticated(true)
    } catch (e) {
      console.log(e)
      if (e.name === "UserNotConfirmedException") {
        try {
          await Auth.resendSignUp(fields.email.toLowerCase())
          alert(`User ${fields.email.toLowerCase()} has not been confirmed. Check email for new confirmation code.`)
          setDisplayConfirmationForm(true)
        }
        catch (resendErr)
        {
          console.log(resendErr)
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

  // const validateConfirmationForm = () => {
  //   return fields.confirmationCode.length > 0
  // }

  // const handleConfirmationSubmit = async event => {
  //   event.preventDefault()

  //   setIsLoading(true)

  //   try {
  //     await Auth.confirmSignUp(fields.email.toLowerCase(), fields.confirmationCode)
  //     await Auth.signIn(fields.email.toLowerCase(), fields.password)

  //     userHasAuthenticated(true)
  //     setDisplayConfirmationForm(false)
  //   } catch (e) {
  //     console.log(e)
  //     if (e.code === "NotAuthorizedException") {
  //       setDisplayConfirmationForm(false)
  //       setSomeFields({confirmationCode:"", password:""})
  //       alert(`User ${fields.email.toLowerCase()} confirmed but incorrect password provided. Try again.`)
  //     } else onError(e)
  //     setIsLoading(false)
  //   }
  //   finally {
  //     setIsLoading(false)
  //   }
  // }

  const handleConfirmationSubmit = async confirmationCode => {

    setIsLoading(true)

    try {
      await Auth.confirmSignUp(fields.email.toLowerCase(), confirmationCode)
      await Auth.signIn(fields.email.toLowerCase(), fields.password)
      // await refreshAccounts()
      // await refreshTemplates()
      // setIsLoading(false)
      // setDisplayConfirmationForm(false)
      setStateToBeRefreshed(true)
      // userHasAuthenticated(true)
    } catch (e) {
      console.log(e)
      if (e.code === "NotAuthorizedException") {
        setDisplayConfirmationForm(false)
        setSomeFields({ password:"" })
        alert(`User ${fields.email.toLowerCase()} confirmed but incorrect password provided. Try again.`)
      } else onError(e)
      setIsLoading(false)
    }
  }

  // const renderConfirmationForm = () =>  {
  //   return (
  //     <Form onSubmit={handleConfirmationSubmit}>
  //       <Form.Group controlId="confirmationCode" size="lg">
  //         <Form.Label>Confirmation Code</Form.Label>
  //         <Form.Control
  //           autoFocus
  //           type="tel"
  //           onChange={handleFieldChange}
  //           value={fields.confirmationCode}
  //         />
  //         <Form.Text muted>Please check your email for the code.</Form.Text>
  //       </Form.Group>
  //       <LoaderButton
  //         block
  //         size="lg"
  //         type="submit"
  //         variant="success"
  //         isLoading={isLoading}
  //         disabled={!validateConfirmationForm()}
  //       >
  //         Verify  
  //       </LoaderButton>
  //     </Form>
  //   )
  // }

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