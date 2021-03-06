import React, { useState } from "react"
import { Auth } from "aws-amplify"
import { useHistory } from "react-router-dom"
import { Form } from "react-bootstrap"
import LoaderButton from "../components/LoaderButton"
import ConfirmationCode from "../components/ConfirmationCode"
import { useAppContext } from "../libs/contextLib"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import "./ChangeEmail.css"

const ChangeEmail = () => {
    const history = useHistory()
    const { email, setEmail } = useAppContext()
    const [codeSent, setCodeSent] = useState(false)
    const [fields, handleFieldChange] = useFormFields({
        email: ""
    })
    const [isConfirming, setIsConfirming] = useState(false)
    const [isSendingCode, setIsSendingCode] = useState(false)

    const validateEmailForm = () =>
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fields.email) &&
        fields.email.toLowerCase() !== email

    const handleUpdateClick = async event => {
        event.preventDefault()

        setIsSendingCode(true)

        try {
            const user = await Auth.currentAuthenticatedUser()
            await Auth.updateUserAttributes(user, { email: fields.email.toLowerCase() })
            setEmail(fields.email.toLowerCase())
            setCodeSent(true)
        } catch (error) {
            onError(error)
            setIsSendingCode(false)
        }
    }

    const handleConfirmClick = async confirmationCode => {

        setIsConfirming(true)

        try {
            await Auth.verifyCurrentUserAttributeSubmit("email", confirmationCode)

            history.push("/settings")
        } catch (error) {
            onError(error)
            setIsConfirming(false)
        }
    }

    const renderUpdateForm = () => {
        return (
            <Form onSubmit={handleUpdateClick}>
                <Form.Group size="lg" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        autoFocus
                        type="email"
                        value={fields.email}
                        onChange={handleFieldChange}
                    />
                </Form.Group>
                <LoaderButton
                    block
                    type="submit"
                    size="lg"
                    isLoading={isSendingCode}
                    disabled={!validateEmailForm()}
                >
                    Update Email
        </LoaderButton>
            </Form>
        )
    }

    return (
        <div className="ChangeEmail">
            {!codeSent ?
                renderUpdateForm() :
                <ConfirmationCode onSubmit={handleConfirmClick} isLoading={isConfirming} />
            }
        </div>
    )
}

export default ChangeEmail