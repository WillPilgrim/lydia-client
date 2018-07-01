import React, { Component } from "react";
import { API } from "aws-amplify";
import {
  FormGroup,
  FormControl,
  ControlLabel,
  InputGroup,
  Checkbox
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import "./NewAccount.css";
import DatePicker from "react-16-bootstrap-date-picker";
import Moment from "moment";

export default class NewAccount extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: null,
      description: "",
      openingDate: Moment().format(),
      closingDate: Moment()
        .add(10, "y")
        .format(), // default closing date to 10 years from now
      accName: "",
      amount100: "0.00",
      crRate: "",
      dbRate: "",
      interest: false
    };
  }

  createAccount(account) {
    return API.post("accounts", "/accounts", {
      body: account
    });
  }

  validateForm() {
    return (
      this.getCrRateValidationState() !== "error" &&
      this.getDbRateValidationState() !== "error" &&
      this.getAmountValidationState() === "success" &&
      this.getDescriptionValidationState() === "success" &&
      this.getNameValidationState() === "success" &&
      this.getOpeningDateValidationState() === "success" &&
      this.getClosingDateValidationState() !== "error"
    );
  }

  getDescriptionValidationState() {
    if (this.state.description.length > 0) return "success";
    return "error";
  }

  getNameValidationState() {
    if (this.state.accName.length > 0) return "success";
    return "error";
  }

  getOpeningDateValidationState() {
    if (this.state.openingDate === null) return "error";
    return "success";
  }

  getClosingDateValidationState() {
    if (this.state.closingDate === null) return "warning";
    if (this.state.openingDate === null) return "warning";
    if (
      Moment(this.state.closingDate).isBefore(
        Moment(this.state.openingDate),
        "day"
      )
    )
      return "error";
    if (Moment(this.state.closingDate).isAfter(Moment().add(30, "y")))
      return "error";
    return "success";
  }

  getAmountValidationState() {
    if (this.state.amount100.length === 0) return "error";
    const regex = /^(-|\+)?[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(this.state.amount100)) return "error";
    let amount = parseFloat(this.state.amount100).toFixed(2) * 100;
    if (isNaN(amount)) return "error";
    if (amount > 99999999 || amount < -99999999) return "error";
    return "success";
  }

  getCrRateValidationState() {
    if (!this.state.interest) return "warning";
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(this.state.crRate)) return "error";
    let amount = parseFloat(this.state.crRate).toFixed(2);
    if (isNaN(amount)) return "error";
    if (amount > 99.99) return "error";
    return "success";
  }

  getDbRateValidationState() {
    if (!this.state.interest) return "warning";
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(this.state.dbRate)) return "error";
    let amount = parseFloat(this.state.dbRate).toFixed(2);
    if (isNaN(amount)) return "error";
    if (amount > 99.99) return "error";
    return "success";
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  handleInterestChange = event => {
    this.setState({
      interest: event.target.checked
    });
  };

  handleOpeningDateChange = value => {
    this.setState({
      openingDate: value
    });
  };

  handleClosingDateChange = value => {
    this.setState({
      closingDate: value
    });
  };

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      await this.createAccount({
        accName: this.state.accName,
        description: this.state.description,
        openingDate: Moment(this.state.openingDate).format(),
        closingDate: Moment(this.state.closingDate).format(),
        amount: parseFloat(this.state.amount100).toFixed(2) * 100,
        crRate: this.state.interest?parseFloat(this.state.crRate).toFixed(2):0,
        dbRate: this.state.interest?parseFloat(this.state.dbRate).toFixed(2):0,
        interest: this.state.interest
      });
      this.props.history.push("/");
    } catch (e) {
      alert(e);
      this.setState({ isLoading: false });
    }
  };

  render() {
    return (
      <div className="NewAccount">
        <form onSubmit={this.handleSubmit}>
          <FormGroup
            controlId="accName"
            validationState={this.getNameValidationState()}
          >
            <ControlLabel>Name</ControlLabel>
            <FormControl 
              value={this.state.accName}
              placeholder="Enter an account Name"
              onChange={this.handleChange}
            />
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup
            controlId="description"
            validationState={this.getDescriptionValidationState()}
          >
            <ControlLabel>Description</ControlLabel>
            <FormControl
              onChange={this.handleChange}
              value={this.state.description}
              componentClass="textarea"
              placeholder="Enter a description"
            />
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup
            controlId="openingDate"
            validationState={this.getOpeningDateValidationState()}
          >
            <ControlLabel>Opening Date</ControlLabel>
            <DatePicker
              id="openingDate"
              value={this.state.openingDate}
              placeholder="Opening date"
              onChange={this.handleOpeningDateChange}
              autoComplete="off"
            />
          </FormGroup>
          <FormGroup
            controlId="closingDate"
            validationState={this.getClosingDateValidationState()}
          >
            <ControlLabel>Closing Date</ControlLabel>
            <DatePicker
              id="closingDate"
              value={this.state.closingDate}
              placeholder="Closing date"
              onChange={this.handleClosingDateChange}
              autoComplete="off"
            />
          </FormGroup>
          <FormGroup
            controlId="amount100"
            validationState={this.getAmountValidationState()}
          >
            <ControlLabel>Opening Balance</ControlLabel>
            <InputGroup>
              <InputGroup.Addon>$</InputGroup.Addon>
              <FormControl
                type="text"
                value={this.state.amount100}
                placeholder="Enter an opening balance"
                onChange={this.handleChange}
              />
            </InputGroup>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup controlId="interest" validationState="success">
            <ControlLabel>Interest</ControlLabel>
            <Checkbox
              checked={this.state.interest}
              onChange={this.handleInterestChange}
            >
              Calculate Interest For This Account
            </Checkbox>
          </FormGroup>
          <FormGroup
            controlId="crRate"
            validationState={this.getCrRateValidationState()}
          >
            <ControlLabel>Credit Rate</ControlLabel>
            <InputGroup>
            <InputGroup.Addon>%</InputGroup.Addon>
              <FormControl
                type="text"
                value={this.state.crRate}
                placeholder="Credit interest rate"
                onChange={this.handleChange}
                disabled={!this.state.interest}
              />
            </InputGroup>
            <FormControl.Feedback />
          </FormGroup>
          <FormGroup
            controlId="dbRate"
            validationState={this.getDbRateValidationState()}
          >
            <ControlLabel>Debit Rate</ControlLabel>
            <InputGroup>
            <InputGroup.Addon>%</InputGroup.Addon>
              <FormControl
                type="text"
                value={this.state.dbRate}
                placeholder="Debit interest rate"
                onChange={this.handleChange}
                disabled={!this.state.interest}
              />
            </InputGroup>
            <FormControl.Feedback />
          </FormGroup>

          <LoaderButton
            block
            bsStyle="primary"
            bsSize="large"
            disabled={!this.validateForm()}
            type="submit"
            isLoading={this.state.isLoading}
            text="Create"
            loadingText="Creating…"
          />
        </form>
      </div>
    );
  }
}
