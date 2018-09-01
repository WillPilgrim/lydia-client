import React, { Component } from "react";
import { API } from "aws-amplify";
import {
  FormGroup, FormControl, ControlLabel, InputGroup,
  Checkbox, Col
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import "./Accounts.css";
import Moment from "moment";
import DatePicker from "react-16-bootstrap-date-picker";
import { today } from "../libs/utilities";

export default class Accounts extends Component {
  constructor(props) {
    super(props);

    this.state = {
      account: null,
      isLoading: null,
      isDeleting: null,
      description: "",
      openingDate: today.format(),
      intFirstAppliedDate: today.format(),
      closingDate: today.clone()
        .add(10, "y")
        .format(), // default closing date to 10 years from now
      accName: "",
      amount100: "0.00",
      crRate: "",
      dbRate: "",
      periodType: 'M',
      periodCnt: 1,
      interest: false
    };
  }

  async componentDidMount() {
    try {
      const account = await this.getAccount();
      const {
        description,
        openingDate,
        closingDate,
        intFirstAppliedDate,
        accName,
        amount,
        crRate,
        dbRate,
        interest,
        periodType,
        periodCnt,
        sortOrder
      } = account;

      this.setState({
        account,
        description,
        openingDate,
        closingDate,
        intFirstAppliedDate,
        accName,
        amount,
        amount100: (amount / 100).toFixed(2),
        crRate,
        dbRate,
        periodType : periodType ? periodType : "M",
        periodCnt : periodCnt ? periodCnt : 1,
        interest,
        sortOrder : sortOrder ? sortOrder : 1
      });
    } catch (e) {
      alert(e);
    }
  }

  getAccount() {
    return API.get("accounts", `/accounts/${this.props.match.params.id}`);
  }

  saveAccount(account) {
    return API.put("accounts", `/accounts/${this.props.match.params.id}`, {
      body: account
    });
  }

  deleteAccount() {
    return API.del("accounts", `/accounts/${this.props.match.params.id}`);
  }

  validateForm() {
    return (
      this.getCrRateValidationState() !== "error" &&
      this.getDbRateValidationState() !== "error" &&
      this.getAmountValidationState() === "success" &&
      this.getDescriptionValidationState() === "success" &&
      this.getNameValidationState() === "success" &&
      this.getOpeningDateValidationState() === "success" &&
      this.getClosingDateValidationState() !== "error" &&
      this.getFreqValidationState() !== "error" &&
      this.getFirstAppliedDateValidationState() !== "error" &&
      this.getPeriodTypeValidationState() !== "error"
    );
  }

  getFreqValidationState() {
    if (!this.state.interest) return "warning";
    if (this.state.periodCnt.length <= 0) return "error";
    if (isNaN(parseInt(this.state.periodCnt, 10)))
      return "error";
    let val = parseInt(this.state.periodCnt, 10);
    if (val > 99 || val < 1)
      return "error";
    return "success";
  }

  getPeriodTypeValidationState() {
    if (!this.state.interest) return "warning";
    return "success";
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
    if (Moment(this.state.openingDate).isAfter(today.clone().add(30, "y"),'day'))
      return "error";
    return "success";
  }

  getFirstAppliedDateValidationState() {
    if (!this.state.interest) return "warning";
    if (this.state.intFirstAppliedDate === null) return "error";
    if (Moment(this.state.intFirstAppliedDate).isAfter(today.clone().add(30, "y"),"day"))
      return "error";
    if (Moment(this.state.intFirstAppliedDate).isBefore(Moment(this.state.openingDate),"day"))
      return "error";
    if (Moment(this.state.intFirstAppliedDate).isAfter(Moment(this.state.closingDate),"day"))
      return "error";
    return "success";
  }

  getClosingDateValidationState() {
    if (this.state.closingDate === null) return "warning";
    if (this.state.openingDate === null) return "warning";
    if (Moment(this.state.closingDate).isBefore(Moment(this.state.openingDate),"day"))
      return "error";
    if (Moment(this.state.closingDate).isAfter(today.clone().add(30, "y"),"day"))
      return "error";
    return "success";
  }

  getAmountValidationState() {
    if (this.state.amount100.length === 0) return "error";
    const regex = /^(-|\+)?[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(this.state.amount100)) return "error";
    let amount = Math.round(parseFloat(this.state.amount100).toFixed(2) * 100);
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

  handleFirstAppliedDateChange = value => {
    this.setState({
      intFirstAppliedDate: value
    });
  };

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      let acc = {
        accName: this.state.accName,
        description: this.state.description,
        openingDate: Moment(this.state.openingDate).startOf('date').format(),
        closingDate: Moment(this.state.closingDate).startOf('date').format(),
        amount: Math.round(parseFloat(this.state.amount100).toFixed(2) * 100),
        crRate: this.state.interest ? parseFloat(this.state.crRate).toFixed(2) : 0,
        dbRate: this.state.interest ? parseFloat(this.state.dbRate).toFixed(2) : 0,
        interest: this.state.interest,
        periodType: this.state.interest ? this.state.periodType : "M",
        periodCnt: this.state.interest ? parseInt(this.state.periodCnt, 10) : 1,
        intFirstAppliedDate: Moment(this.state.intFirstAppliedDate).startOf('date').format(),
        sortOrder: this.state.sortOrder
      }
      await this.saveAccount(acc);
      await this.props.refreshAccounts();
      this.props.setRecalcRequired(true)
      this.props.history.push("/");
    } catch (e) {
      alert(e);
      this.setState({ isLoading: false });
    }
  }

  handleDelete = async event => {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this account?"
    );

    if (!confirmed) {
      return;
    }

    this.setState({ isDeleting: true });

    try {
      await this.deleteAccount();
      await this.props.refreshAccounts();
      this.props.setRecalcRequired(false)
      this.props.history.push("/");
    } catch (e) {
      alert(e);
      this.setState({ isDeleting: false });
    }
  }
  
  handleFocus = event => {
    event.target.select();
  }

  render() {
    return (
      <div className="Accounts">
        {this.state.account &&
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
                  onFocus={this.handleFocus}
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
            <Col sm={6}>

              <FormGroup
                controlId="crRate"
                validationState={this.getCrRateValidationState()}
              >
                <ControlLabel>Opening Credit Rate</ControlLabel>
                <InputGroup>
                  <InputGroup.Addon>%</InputGroup.Addon>
                  <FormControl
                    type="text"
                    value={this.state.crRate}
                    placeholder="Credit interest rate"
                    onChange={this.handleChange}
                    disabled={!this.state.interest}
                    onFocus={this.handleFocus}
                  />
                </InputGroup>
                <FormControl.Feedback />
              </FormGroup>
              <FormGroup
                controlId="dbRate"
                validationState={this.getDbRateValidationState()}
              >
                <ControlLabel>Opening Debit Rate</ControlLabel>
                <InputGroup>
                  <InputGroup.Addon>%</InputGroup.Addon>
                  <FormControl
                    type="text"
                    value={this.state.dbRate}
                    placeholder="Debit interest rate"
                    onChange={this.handleChange}
                    disabled={!this.state.interest}
                    onFocus={this.handleFocus}
                  />
                </InputGroup>
                <FormControl.Feedback />
              </FormGroup>
              <FormGroup
                controlId="intFirstAppliedDate"
                validationState={this.getFirstAppliedDateValidationState()}
              >
                <ControlLabel>First Applied Date</ControlLabel>
                <DatePicker
                  id="intFirstAppliedDate"
                  value={this.state.intFirstAppliedDate}
                  placeholder="First Applied Date"
                  onChange={this.handleFirstAppliedDateChange}
                  autoComplete="off"
                  disabled={!this.state.interest}
                />
              </FormGroup>
            </Col>
            <Col sm={6}>

              <FormGroup controlId="periodType" validationState={this.getPeriodTypeValidationState()}>
                <ControlLabel>Period Type</ControlLabel>
                <FormControl
                  componentClass="select"
                  type="text"
                  value={this.state.periodType}
                  placeholder="Select period type"
                  onChange={this.handleChange}
                  disabled={!this.state.interest}
                >
                  <option value="M">Month</option>
                  <option value="w">Week</option>
                  <option value="y">Year</option>
                  <option value="Q">Quarter</option>
                  <option value="d">Day</option>
                </FormControl>
              </FormGroup>

              <FormGroup controlId="periodCnt" validationState={this.getFreqValidationState()}>
                <ControlLabel>Frequency</ControlLabel>
                <FormControl
                  type="text"
                  value={this.state.periodCnt}
                  placeholder="Number of periods"
                  onChange={this.handleChange}
                  disabled={!this.state.interest}
                  onFocus={this.handleFocus}
                />
              </FormGroup>

            </Col>

            <LoaderButton
              block
              bsStyle="primary"
              bsSize="large"
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text="Save"
              loadingText="Saving…"
            />
            <LoaderButton
              block
              bsStyle="danger"
              bsSize="large"
              isLoading={this.state.isDeleting}
              onClick={this.handleDelete}
              text="Delete"
              loadingText="Deleting…"
            />
          </form>}
      </div>
    );
  }
}
