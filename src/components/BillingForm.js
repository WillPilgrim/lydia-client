import React, { useState } from "react"
import Form from "react-bootstrap/Form"
import { CardElement, injectStripe } from "react-stripe-elements"
import LoaderButton from "./LoaderButton"
import { useFormFields } from "../libs/hooksLib"
import "./BillingForm.css"

const BillingForm = ({ isLoading, onSubmit, ...props }) => {

  const [fields, handleFieldChange] = useFormFields({
    name: "",
    accounts: ""
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCardComplete, setIsCardComplete] = useState(false)

  isLoading = isProcessing || isLoading

  const validateForm = () => fields.name !== "" && fields.accounts !== "" && isCardComplete

  const handleSubmitClick = async event => {
    event.preventDefault()

    setIsProcessing(true)

    const { token, error } = await props.stripe.createToken({ name: fields.name })

    setIsProcessing(false)

    onSubmit(fields.accounts, { token, error })
  }

  return (
    <Form className="BillingForm" onSubmit={handleSubmitClick}>
      <Form.Group size="lg" controlId="accounts">
        <Form.Label>Accounts</Form.Label>
        <Form.Control
          min="0"
          type="number"
          value={fields.accounts}
          onChange={handleFieldChange}
          placeholder="Maximum number of accounts"
        />
      </Form.Group>
      <hr />
      <Form.Group size="lg" controlId="name">
        <Form.Label>Cardholder&apos;s name</Form.Label>
        <Form.Control
          type="text"
          value={fields.name}
          onChange={handleFieldChange}
          placeholder="Name on the card"
        />
      </Form.Group>
      <Form.Label>Credit Card Info</Form.Label>
      <CardElement
        className="card-field"
        onChange={(e) => setIsCardComplete(e.complete)}
        style={{
          base: {
            fontSize: "16px",
            color: "#495057",
            fontFamily: "'Open Sans', sans-serif"
          }
        }}
      />
      <LoaderButton
        block
        size="lg"
        type="submit"
        text="Purchase"
        isLoading={isLoading}
        disabled={!validateForm()}
      >
        Purchase
      </LoaderButton>
    </Form>
  )
}

export default injectStripe(BillingForm)