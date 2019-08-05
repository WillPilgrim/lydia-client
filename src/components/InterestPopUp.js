import React, { Component } from "react"
import {
    Modal,
    FormGroup,
    FormControl,
    ControlLabel,
    Checkbox,
    Button,
    InputGroup
  } from "react-bootstrap"
import DatePicker from "react-16-bootstrap-date-picker"
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
            <FormGroup
                controlId="intFirstAppliedDate"
                validationState={this.getFirstAppliedDateValidationState()}
            >
                <ControlLabel>Start Date</ControlLabel>
                <DatePicker
                id="intFirstAppliedDate"
                value={this.state.intFirstAppliedDate}
                placeholder="Date"
                onChange={this.handleFirstAppliedDateChange}
                autoComplete="off"
                />
            </FormGroup>
            <FormGroup
                controlId="newRateValue"
                validationState={this.getNewRateValidationState()}
            >
                <ControlLabel>Interest Rate</ControlLabel>
                <InputGroup>
                <InputGroup.Addon>%</InputGroup.Addon>
                <FormControl
                    type="text"
                    value={this.state.newRateValue}
                    placeholder="Rate"
                    onChange={this.handleChange}
                    onFocus={this.handleFocus}
                />
                </InputGroup>
                <FormControl.Feedback />
            </FormGroup>
            <FormGroup controlId="newRateCredit" validationState="success">
                <Checkbox
                checked={this.state.newRateCredit}
                onChange={this.handleInterestTypeChange}
                >
                Credit Interest
                </Checkbox>
            </FormGroup>
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