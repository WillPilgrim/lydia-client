import React, { Component } from "react"
import {
    Modal,
    Button,
    InputGroup
  } from "react-bootstrap"
  // import { Checkbox } from "react-bootstrap"; to be fixed
import Form from "react-bootstrap/Form";
import DatePicker from "react-datepicker"
import Moment from "moment"
import { today } from "../libs/utilities"

class InterestPopUp extends Component {
  constructor(props) {
    super(props)

    this.state = {
      newRateValue: 0, 
      newRateCredit: false,
      intFirstAppliedDate: today.format()
    }
  }

  validateForm() {
    return (
      this.getNewRateValidationState() !== "error" &&
      this.getFirstAppliedDateValidationState() !== "error"
    )
  }

  getNewRateValidationState() {
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(this.state.newRateValue)) return "error"
    let amount = parseFloat(this.state.newRateValue).toFixed(2)
    if (isNaN(amount)) return "error"
    if (amount > 99.99) return "error"
    return "success"
  }

  getFirstAppliedDateValidationState() {
    if (this.state.intFirstAppliedDate === null) return "error"
    if (Moment(this.state.intFirstAppliedDate).isAfter(today.clone().add(30, "y"),"day")) return "error"
    const transAcc = this.props.transAcc
    if (transAcc) {
      const acc = transAcc.find(x => x.accountId === this.props.currentAccId)
      if (acc) {
        if (Moment(this.state.intFirstAppliedDate).isBefore(Moment(acc.openingDate),"day")) return "error"
        if (Moment(this.state.intFirstAppliedDate).isAfter(Moment(acc.closingDate),"day")) return "error"
      }
    }
    return "success"
  }

  handleFirstAppliedDateChange = value => {
    this.setState({intFirstAppliedDate: value})
  }

  handleInterestTypeChange = event => {
    this.setState({newRateCredit: event.target.checked})
  }
  
  handleFocus = event => {
    event.target.select()
  }

  handleChange = event => {
    this.setState({[event.target.id]: event.target.value})
  }
  
  handleAdd = () => {
    this.props.onSubmit(this.state.newRateValue, this.state.newRateCredit, this.state.intFirstAppliedDate)
  }

  render() {
    return (
        <Modal show={this.props.showInterest} onHide={this.props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Interest Rate Change</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <Form.Group
                controlId="intFirstAppliedDate"
                validationState={this.getFirstAppliedDateValidationState()}
            >
                <Form.Label>Start Date</Form.Label>
                <DatePicker
                id="intFirstAppliedDate"
                value={this.state.intFirstAppliedDate}
                placeholder="Date"
                onChange={this.handleFirstAppliedDateChange}
                autoComplete="off"
                />
            </Form.Group>
            <Form.Group
                controlId="newRateValue"
                validationState={this.getNewRateValidationState()}
            >
                <Form.Label>Interest Rate</Form.Label>
                <InputGroup>
                <InputGroup.Addon>%</InputGroup.Addon>
                <Form.Control
                    type="text"
                    value={this.state.newRateValue}
                    placeholder="Rate"
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                />
                </InputGroup>
                <Form.Control.Feedback />
            </Form.Group>
            <Form.Group controlId="newRateCredit" validationState="success">
                {/* <Checkbox
                checked={this.state.newRateCredit}
                onChange={this.handleInterestTypeChange}
                >
                Credit Interest
                </Checkbox> */}
            </Form.Group>
            </Modal.Body>
            <Modal.Footer>
            <Button onClick={this.props.onClose}>Close</Button>
            <Button disabled={!this.validateForm()} bsStyle="primary" onClick={this.handleAdd}>Add</Button>
            </Modal.Footer>
        </Modal>
    )
  }
}

export default InterestPopUp