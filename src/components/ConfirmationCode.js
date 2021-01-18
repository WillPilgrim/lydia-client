import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import LoaderButton from "../components/LoaderButton"

const ConfirmationCode = ({ isLoading, onSubmit, title="Confirmation" }) =>  {

    const [code, setCode] = useState("")

    const validateForm = () => code.length > 0

    const handleSubmitClick = async event => {
        event.preventDefault()
    
        onSubmit(code)
    }

    return (
      <Form onSubmit={handleSubmitClick}>
        <Form.Group controlId="confirmationCode" size="lg">
          <Form.Label>{title} Code</Form.Label>
          <Form.Control
            autoFocus
            type="tel"
            onChange={event => setCode(event.target.value)}
            value={code}
          />
          <Form.Text muted>Please check your email for the code.</Form.Text>
        </Form.Group>
        <LoaderButton
          block
          size="lg"
          type="submit"
          variant="success"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Verify  
        </LoaderButton>
      </Form>
    )
}

export default ConfirmationCode