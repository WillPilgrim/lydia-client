import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import { useHistory } from "react-router-dom"
import LoaderButton from "../components/LoaderButton"
import { useAppContext } from "../libs/contextLib"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import { Auth } from "aws-amplify"
import "./Signup.css"

const Signup = () => {

  const [fields, handleFieldChange] = useFormFields({
    email: "",
    password: "",
    confirmPassword: "",
    confirmationCode: ""
  })
  const history = useHistory();
  const [newUser, setNewUser] = useState(null)
  const { userHasAuthenticated } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    return (
      fields.email.length > 0 &&
      fields.password.length > 0 &&
      fields.password === fields.confirmPassword
    )
  }

  const validateConfirmationForm = () => {
    return fields.confirmationCode.length > 0
  }

  const handleSubmit = async event => {
    event.preventDefault()

    setIsLoading(true)

    try {
      const newUser = await Auth.signUp({
        username: fields.email.toLowerCase(),
        password: fields.password
      })
      setIsLoading(false)
      setNewUser(newUser)
    } 
    catch (e) {
      console.log(e)
      if (e.name === "UsernameExistsException") {
        try {
          await Auth.confirmSignUp(fields.email.toLowerCase(),"fake")
          alert(`Something went wrong. User ${fields.email.toLowerCase()} confirmed with fake code!`)
        } 
        catch (confirmErr) {
          console.log(confirmErr)
          if (confirmErr.code === "NotAuthorizedException") {
            alert(`Sorry, user ${fields.email.toLowerCase()} already exists. Choose another email address.`)
          } else if (confirmErr.code === "CodeMismatchException") {
            try {
              const newUser = await Auth.resendSignUp(fields.email.toLowerCase())
              alert(`Unconfirmed user ${fields.email.toLowerCase()} already exists. Check email for new confirmation code.`)
              setNewUser(newUser)
            }
            catch (resendErr) {
              console.log(resendErr)
              onError(resendErr)
            }
          } 
          else onError(confirmErr)
        }
      }
      else onError(e)
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleConfirmationSubmit = async event => {
    event.preventDefault()

    setIsLoading(true)

    try {
      await Auth.confirmSignUp(fields.email.toLowerCase(), fields.confirmationCode)
      await Auth.signIn(fields.email.toLowerCase(), fields.password)

      userHasAuthenticated(true)
      history.push("/")
    } catch (e) {
      onError(e)
      setIsLoading(false)
    }
  }

  const renderConfirmationForm = () =>  {
    return (
      <Form onSubmit={handleConfirmationSubmit}>
        <Form.Group controlId="confirmationCode" size="lg">
          <Form.Label>Confirmation Code</Form.Label>
          <Form.Control
            autoFocus
            type="tel"
            onChange={handleFieldChange}
            value={fields.confirmationCode}
          />
          <Form.Text muted>Please check your email for the code.</Form.Text>
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
          variant="success"
          isLoading={isLoading}
          disabled={!validateConfirmationForm()}
        >
          Verify  
        </LoaderButton>
      </Form>
    );
  }

  const renderForm = () => {
    return (
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="email" size="lg">
          <Form.Label>Email</Form.Label>
          <Form.Control
            autoFocus
            type="email"
            value={fields.email}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group controlId="password" size="lg">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={fields.password}
            onChange={handleFieldChange}
          />
        </Form.Group>
        <Form.Group controlId="confirmPassword" size="lg">
          <Form.Label>Confirm Password</Form.Label>
          <Form.Control
            type="password"
            onChange={handleFieldChange}
            value={fields.confirmPassword}
          />
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
          variant="success"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Signup
        </LoaderButton>
      </Form>
    )
  }

  return (
    <div className="Signup">
      {newUser === null ? renderForm() : renderConfirmationForm()}
    </div>
  )
}

export default Signup