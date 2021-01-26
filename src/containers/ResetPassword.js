import React, { useState } from "react"
import { Auth } from "aws-amplify"
import { Link } from "react-router-dom"
import { BsCheck } from "react-icons/bs"
import Form from "react-bootstrap/Form"
import LoaderButton from "../components/LoaderButton"
import { useFormFields } from "../libs/hooksLib"
import "./ResetPassword.css"
import { onError } from "../libs/errorLib"

const ResetPassword = () => {

    const [fields, handleFieldChange] = useFormFields({
        code: "",
        email: "",
        password: "",
        confirmPassword: ""
    })
    const [codeSent, setCodeSent] = useState(false)
    const [confirmed, setConfirmed] = useState(false)
    const [isConfirming, setIsConfirming] = useState(false)
    const [isSendingCode, setIsSendingCode] = useState(false)

    const validateCodeForm = () =>
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fields.email)

    const validateResetForm = () =>
        fields.code.length > 0 &&
        fields.password.length > 0 &&
        fields.password === fields.confirmPassword

    const handleSendCodeClick = async event => {
        event.preventDefault()

        setIsSendingCode(true)

        try {
            await Auth.forgotPassword(fields.email)
            setCodeSent(true)
        } catch (e) {
            onError(e)
            setIsSendingCode(false)
        }
    }

    const handleConfirmClick = async event => {
        event.preventDefault()

        setIsConfirming(true)

        try {
            await Auth.forgotPasswordSubmit(
                fields.email,
                fields.code,
                fields.password
            )
            setConfirmed(true)
        } catch (e) {
            onError(e)
            setIsConfirming(false)
        }
    }

    const renderRequestCodeForm = () => {
        return (
            <form onSubmit={handleSendCodeClick}>
                <Form.Group size="lg" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        autoFocus
                        type="email"
                        placeholder="Enter email"
                        value={fields.email}
                        onChange={handleFieldChange}
                    />
                </Form.Group>
                <LoaderButton
                    block
                    type="submit"
                    size="lg"
                    isLoading={isSendingCode}
                    disabled={!validateCodeForm()}
                >
                    Send Confirmation
        </LoaderButton>
            </form>
        )
    }

    const renderConfirmationForm = () => {
        return (
            <form onSubmit={handleConfirmClick}>
                <Form.Group size="lg" controlId="code">
                    <Form.Label>Confirmation Code</Form.Label>
                    <Form.Control
                        autoFocus
                        type="tel"
                        value={fields.code}
                        onChange={handleFieldChange}
                    />
                    <Form.Text muted>Please check your email ({fields.email}) for the confirmation code.</Form.Text>
                </Form.Group>
                <hr />
                <Form.Group size="lg" controlId="password">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control
                        type="password"
                        value={fields.password}
                        onChange={handleFieldChange}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                        type="password"
                        onChange={handleFieldChange}
                        value={fields.confirmPassword}
                    />
                </Form.Group>
                <LoaderButton
                    block
                    type="submit"
                    size="lg"
                    isLoading={isConfirming}
                    disabled={!validateResetForm()}
                >
                    Confirm
        </LoaderButton>
            </form>
        )
    }

    const renderSuccessMessage = () =>
        <div className="success">
            <BsCheck />
            <p>Your password has been reset.</p>
            <p>
                <Link to="/login">
                    Click here to login with your new credentials.
        </Link>
            </p>
        </div>

    return (
        <div className="ResetPassword">
            {!codeSent
                ? renderRequestCodeForm()
                : !confirmed
                    ? renderConfirmationForm()
                    : renderSuccessMessage()}
        </div>
    )
}

export default ResetPassword