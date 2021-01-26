import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import LoaderButton from "../components/LoaderButton"
import ConfirmationCode from "../components/ConfirmationCode"
import { useAppContext } from "../libs/contextLib"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import { Auth } from "aws-amplify"
import "./Signup.css"

const Signup = () => {

    const [fields, handleFieldChange] = useFormFields({
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [newUser, setNewUser] = useState(null)
    const { setStateToBeRefreshed } = useAppContext()
    const [isLoading, setIsLoading] = useState(false)

    const validateEmail = () =>
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fields.email)

    const validateForm = () =>
        validateEmail() &&
        fields.password.length > 0 &&
        fields.password === fields.confirmPassword

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
            if (e.name === "UsernameExistsException")
                alert(`Sorry, user ${fields.email.toLowerCase()} already exists. Choose another email address.`)
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
            onError(e)
        }
        finally {
            setIsLoading(false)
        }
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
            {newUser === null ?
                renderForm() :
                <ConfirmationCode onSubmit={handleConfirmationSubmit} isLoading={isLoading} />
            }
        </div>
    )
}

export default Signup