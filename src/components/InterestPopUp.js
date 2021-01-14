import React, { useState } from "react"
import { Modal, Button, InputGroup } from "react-bootstrap"
import Form from "react-bootstrap/Form"
import DatePicker from "react-datepicker"
import Moment from "moment"
import { useAppContext } from "../libs/contextLib"
import { today } from "../libs/utilities"

const InterestPopUp = props => {
  const { transAcc, currentAccId } = useAppContext()
  const [newRateValue, setNewRateValue] = useState(0)
  const [newRateCredit, setNewRateCredit] = useState(false)
  const [intFirstAppliedDate, setIntFirstAppliedDate] = useState(today.toDate())

  const isValidFirstAppliedDate = () => {
    if (intFirstAppliedDate === null) return false
    if (Moment(intFirstAppliedDate).isAfter(today.clone().add(30, "y"),"day")) return false
    if (transAcc) {
      const acc = transAcc.find(x => x.accountId === currentAccId)
      if (acc) {
        if (Moment(intFirstAppliedDate).isBefore(Moment(acc.openingDate),"day")) return false
        if (Moment(intFirstAppliedDate).isAfter(Moment(acc.closingDate),"day")) return false
      }
    }
    return true
  }

  const isValidNewRate = () => {
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(newRateValue)) return false
    const amount = parseFloat(newRateValue).toFixed(2)
    if (isNaN(amount)) return false
    if (amount > 99.99) return false
    return true
  }

  const validateForm = () => (
    isValidFirstAppliedDate() &&
    isValidNewRate()
  )

  const handleAdd = () => props.onSubmit(newRateValue, newRateCredit, intFirstAppliedDate)
  
  return (
      <Modal {...props} animation={false}>

          <Modal.Header closeButton>
              <Modal.Title>Interest Rate Change</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group controlId="intFirstAppliedDate">
                <Form.Label>Start Date</Form.Label>
                <div>
                  <DatePicker 
                    dateFormat="dd/MM/yyyy" 
                    selected={intFirstAppliedDate} 
                    onChange={value => setIntFirstAppliedDate(value)} 
                  />
                </div>
            </Form.Group>
            <Form.Group controlId="newRateValue">
                <Form.Label>Interest Rate</Form.Label>
                <InputGroup className="mb-3">
                  <InputGroup.Prepend>
                    <InputGroup.Text>%</InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                      type="text"
                      value={newRateValue}
                      placeholder="Rate"
                      onChange={event => setNewRateValue(event.target.value)}
                      onFocus={event => event.target.select()}
                      isValid={isValidNewRate(newRateValue)}
                      isInvalid={!isValidNewRate(newRateValue)}
                  />
                <Form.Control.Feedback type="invalid">Please enter a valid, non-negative interest rate. Zero is valid.</Form.Control.Feedback>
                </InputGroup>
            </Form.Group>
            <Form.Group controlId="newRateCredit">
              <Form.Check
                type='checkbox'
                label="Credit Interest"
                checked={newRateCredit}
                onChange={event => setNewRateCredit(event.target.checked)}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="outline-secondary" onClick={props.onHide}>Close</Button>
            <Button variant="outline-primary" disabled={!validateForm()} onClick={handleAdd}>Add</Button>
          </Modal.Footer>

      </Modal>
  )
}

export default InterestPopUp