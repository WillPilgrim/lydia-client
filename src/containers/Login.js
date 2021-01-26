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
    const [displayConfirmationForm, setDisplayConfirmationForm] = useState("none")
    const [fields, handleFieldChange, setSomeFields] = useFormFields({
        email: "",
        password: ""
    })

    const validateEmail = () =>
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fields.email)

    const validateForm = () =>
        validateEmail() &&
        fields.password.length > 0

    const handleSubmit = async event => {
        event.preventDefault()

        setIsLoading(true)

        try {
            const user = await Auth.signIn(fields.email.toLowerCase(), fields.password)
            if (user.attributes.email_verified)
                setStateToBeRefreshed(value => !value)
            else {
                await Auth.verifyCurrentUserAttribute("email")
                alert(`Email account ${fields.email.toLowerCase()} has not been verified. Check email for new verification code.`)
                setDisplayConfirmationForm("Verification")
            }
        } catch (e) {
            if (e.name === "UserNotConfirmedException") {
                try {
                    await Auth.resendSignUp(fields.email.toLowerCase())
                    alert(`User ${fields.email.toLowerCase()} has not been confirmed. Check email for new confirmation code.`)
                    setDisplayConfirmationForm("Confirmation")
                }
                catch (resendErr) {
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

        if (displayConfirmationForm === "Verification") {
            try {
                await Auth.verifyCurrentUserAttributeSubmit("email", confirmationCode)
                setDisplayConfirmationForm("none")
            } catch (e) {
                onError(e)
            }
            finally {
                setIsLoading(false)
                setStateToBeRefreshed(value => !value)
            }
        }
        else
            try {
                await Auth.confirmSignUp(fields.email.toLowerCase(), confirmationCode)
                await Auth.signIn(fields.email.toLowerCase(), fields.password)
                setStateToBeRefreshed(value => !value)
            } catch (e) {
                if (e.code === "NotAuthorizedException") {
                    setSomeFields({ password: "" })
                    alert(`User ${fields.email.toLowerCase()} confirmed but incorrect password provided. Try again.`)
                    setDisplayConfirmationForm("none")
                }
                else
                    onError(e)
            }
            finally {
                setIsLoading(false)
            }
    }

    const renderForm = () => {
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
            {displayConfirmationForm === "none" ?
                renderForm()
                : <ConfirmationCode
                    onSubmit={handleConfirmationSubmit}
                    isLoading={isLoading}
                    title={displayConfirmationForm}
                />
            }
        </div>
    )
}

export default Login