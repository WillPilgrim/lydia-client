import React, { useState } from "react"
import { Auth } from "aws-amplify"
import Form from "react-bootstrap/Form"
import { Link } from "react-router-dom"
import LoaderButton from "../components/LoaderButton"
import { useAppContext } from "../libs/contextLib"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import "./Login.css"

const Login = () => {

  const { userHasAuthenticated, refreshAccounts, refreshTemplates, setStateToBeRefreshed } = useAppContext()
  const [isLoading, setIsLoading] = useState(false)
  const [fields, handleFieldChange] = useFormFields({
    email: "",
    password: ""
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
      onError(e)
      setIsLoading(false)
    }
  }

  return (
    <div className="Login">
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
    </div>
  )
}

export default Login