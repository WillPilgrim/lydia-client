import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import LoaderButton from "../components/LoaderButton"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import Confirm from "../components/Confirm"
import "./Contact.css"

const FORMSPARK_ACTION_URL = "https://submit-form.com/cN7klpfC"

const Contact = () => {

    const [showConfirm, setShowConfirm] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [fields, handleFieldChange, setSomeFields] = useFormFields({
        name: "",
        email: "",
        message: ""
    })

    const validateForm = () => 
        fields.name.length > 0 && 
        validateEmail() && 
        fields.message.length > 0
    
    const validateEmail = () => 
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(fields.email)

    const onSubmit = async e => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await fetch(FORMSPARK_ACTION_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                   Name: fields.name,
                   Email: fields.email,
                   Message: fields.message
                })
            })
            setShowConfirm(true)
            setSomeFields({ name: "", email:"", message:"" })
            document.getElementById('home').scrollIntoView(true)
        } catch (e) {
            onError(e)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="Contact">
            <Confirm title="Contact" body="Feedback submitted. Thank you!" show={showConfirm} setShow={setShowConfirm} />
            <p>Do you have any suggestions or questions, or just want to leave some feedback? We'd love to hear from you!</p>
            <Form onSubmit={onSubmit}>
                <Form.Group size="lg" controlId="name">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                        autoFocus
                        type="text"
                        maxLength="50"
                        value={fields.name}
                        onChange={handleFieldChange}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                        autoFocus
                        type="email"
                        value={fields.email}
                        onChange={handleFieldChange}
                    />
                </Form.Group>
                <Form.Group size="lg" controlId="message">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                        as="textarea"
                        maxL ength="500"
                        value={fields.message}
                        onChange={handleFieldChange}
                    />
                </Form.Group>
                <LoaderButton
                    block
                    size="lg"
                    type="submit"
                    isLoading={submitting}
                    disabled={!validateForm()}
                >
                    Send Message
            </LoaderButton>
            </Form>
        </div>
    )
}

export default Contact