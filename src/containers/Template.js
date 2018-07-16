import React, { Component } from "react";
import { API } from "aws-amplify";
import {
  FormGroup,
  FormControl,
  ControlLabel,
  InputGroup,
  Col
} from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import "./Template.css";
import DatePicker from "react-16-bootstrap-date-picker";
import Moment from "moment";

export default class Template extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: null,
      isDeleting: null,
      template: null,
      description: "",
      amount: 0,
      startDate: Moment().format(),
      endDate: Moment()
        .add(10, "y")
        .format(),
      accountFromId: "",
      accountToId: "0",
      templateType: "Debit",
      periodType: "M",
      periodCnt: 1,
      periodLastDay: 0,
      templateId: null,
      new: ""
    };
  }

  async componentDidMount() {
    try {
      let template;
      if (this.props.match.params.id === "new") {
        template = this.state;
        template.accountFromId = this.props.accounts
          ? this.props.accounts[0].accountId
          : "0";
      } else {
        template = await this.getTemplate();
      }
      const {
        accountFromId,
        accountToId,
        description,
        amount,
        startDate,
        endDate,
        templateType,
        periodType,
        periodCnt,
        periodLastDay,
        templateId
      } = template;
      this.setState({
        accountFromId,
        accountToId,
        template,
        description,
        amount,
        amount100: (amount / 100).toFixed(2),
        startDate,
        endDate,
        templateType,
        periodType,
        periodCnt,
        periodLastDay: periodLastDay ? periodLastDay : 0,
        templateId
      });
    } catch (e) {
      alert(e);
    }
  }

  getTemplate() {
    return API.get("accounts", `/templates/${this.props.match.params.id}`);
  }

  saveTemplate(template) {
    return API.put("accounts", `/templates/${this.props.match.params.id}`, {
      body: template
    });
  }

  createTemplate(template) {
    return API.post("accounts", "/templates", {
      body: template
    });
  }

  deleteTemplate() {
    return API.del("accounts", `/templates/${this.props.match.params.id}`);
  }

  validateForm() {
    return (
      this.getDescriptionValidationState() === "success" &&
      this.getFreqValidationState() === "success" &&
      this.getAmountValidationState() === "success" &&
      this.getStartDateValidationState() === "success" &&
      this.getEndDateValidationState() !== "error" &&
      this.getToAccountValidationState() === "success" &&
      this.getLastPeriodDayValidationState() !== "error"
    );
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  handleTypeChange = event => {
    this.setState({
      [event.target.id]: event.target.value,
      accountToId: "0"
    });
  };

  handleStartDateChange = value => {
    this.setState({
      startDate: value
    });
  };

  handleEndDateChange = value => {
    this.setState({
      endDate: value
    });
  };

  handleFocus = event => {
    event.target.select();
  };

  handleSubmit = async event => {
    event.preventDefault();

    if (this.state.templateType === "CC") {
      if (this.props.templates) {
        if (
          this.props.templates.find(x => x.accountFromId === this.state.accountFromId) &&
          !this.state.templateId
        ) {
          alert(
            `Credit card template already exists for account '${
              this.props.accounts.find(
                x => x.accountId === this.state.accountFromId
              ).accName
            }'`
          );
          return;
        }
      }
    }

    this.setState({ isLoading: true });

    try {
      const templ = {
        numPeriods: this.state.template.numPeriods,
        noEnd: this.state.template.noEnd,
        inflation: this.state.template.inflation,

        description: this.state.description,
        amount: parseFloat(this.state.amount100).toFixed(2) * 100,
        startDate: Moment(this.state.startDate).format(),
        endDate:
          this.state.templateType === "Zero"
            ? Moment(this.state.startDate).format()
            : Moment(this.state.endDate).format(),
        templateType: this.state.templateType,
        periodType: this.state.periodType,
        periodCnt:
          this.state.templateType !== "Zero"
            ? parseInt(this.state.periodCnt, 10)
            : 1,
        periodLastDay:
          this.state.templateType === "CC"
            ? parseInt(this.state.periodLastDay, 10)
            : 0,
        accountFromId: this.state.accountFromId,
        accountToId: this.state.accountToId
      };
      if (this.props.match.params.id === "new") {
        await this.createTemplate(templ);
      } else {
        await this.saveTemplate(templ);
      }
      this.setState({ isLoading: false });
      await this.props.refreshTemplates();
      this.props.setRecalcRequired(true)
      this.props.history.push("/templates");
    } catch (e) {
      alert(e);
      this.setState({ isLoading: false });
    }
  };

  handleDelete = async event => {
    event.preventDefault();

    const confirmed = window.confirm(
      "Are you sure you want to delete this template?"
    );

    if (!confirmed) {
      return;
    }

    this.setState({ isDeleting: true });

    try {
      await this.deleteTemplate();
      await this.props.refreshTemplates();
      this.props.setRecalcRequired(true)
      this.props.history.push("/templates");
    } catch (e) {
      alert(e);
      this.setState({ isDeleting: false });
    }
  };

  getDescriptionValidationState() {
    if (this.state.description.length > 0) return "success";
    return "error";
  }

  getAmountValidationState() {
    if (this.state.amount100.length === 0) return "error";
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (regex.test(this.state.amount100)) return "success";
    return "error";
  }

  getFreqValidationState() {
    if (this.state.periodCnt.length <= 0) return "error";
    if (isNaN(parseInt(this.state.periodCnt, 10))) return "error";
    else return "success";
  }

  getLastPeriodDayValidationState() {
    if (this.state.templateType !== "CC") return "success";
    if (this.state.periodLastDay.length === 0) return "error";
    if (isNaN(parseInt(this.state.periodLastDay, 10))) return "error";
    let val = parseInt(this.state.periodLastDay, 10);
    if (val < 1 || val > 28) return "error";
    return "success";
  }

  getStartDateValidationState() {
    if (this.state.startDate === null) return "error";
    return "success";
  }

  getEndDateValidationState() {
    if (this.state.endDate === null) return "warning";
    if (this.state.startDate === null) return "warning";
    if (
      Moment(this.state.endDate).isBefore(Moment(this.state.startDate), "day")
    )
      return "error";
    return "success";
  }

  getToAccountValidationState() {
    let partnerRequired =
      this.state.templateType === "Transfer" ||
      this.state.templateType === "CC";
    if (partnerRequired && this.state.accountToId === "0") return "error"; // can't have transfer type without account
    let partnerNotAllowed =
      this.state.templateType === "Debit" ||
      this.state.templateType === "Credit";
    if (partnerNotAllowed && this.state.accountToId !== "0") return "error";
    if (this.state.accountFromId === this.state.accountToId) return "error"; // from account equals to account
    return "success";
  }

  render() {
    return (
      <div className="Template">
        {this.state.template && (
          <form onSubmit={this.handleSubmit}>
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
            <Col sm={6}>
              <FormGroup controlId="templateType" validationState="success">
                <ControlLabel>Transaction Type</ControlLabel>
                <FormControl
                  componentClass="select"
                  type="text"
                  value={this.state.templateType}
                  placeholder="Select transaction type"
                  onChange={this.handleTypeChange}
                >
                  <option value="Debit">Debit</option>
                  <option value="Credit">Credit</option>
                  <option value="Transfer">Transfer</option>
                  <option value="CC">Credit Card</option>
                  <option value="Minimise">Minimise</option>
                  <option value="Zero">Zero</option>
                </FormControl>
              </FormGroup>
              <FormGroup
                controlId="startDate"
                validationState={this.getStartDateValidationState()}
              >
                <ControlLabel>Start Date</ControlLabel>
                <DatePicker
                  id="startDate"
                  value={this.state.startDate}
                  placeholder="Start date"
                  onChange={this.handleStartDateChange}
                  autoComplete="off"
                />
              </FormGroup>
              <FormGroup
                controlId="endDate"
                validationState={this.getEndDateValidationState()}
              >
                <ControlLabel>End Date</ControlLabel>
                <DatePicker
                  id="endDate"
                  value={this.state.endDate}
                  placeholder="End date"
                  onChange={this.handleEndDateChange}
                  autoComplete="off"
                  disabled={this.state.templateType === "Zero"}
                />
              </FormGroup>
              <FormGroup controlId="accountFromId" validationState="success">
                <ControlLabel>Template Account</ControlLabel>
                <FormControl
                  componentClass="select"
                  type="text"
                  value={this.state.accountFromId}
                  placeholder="Select account template applies to"
                  onChange={this.handleChange}
                >
                  {this.props.accounts.map(x => (
                    <option key={x.accountId} value={x.accountId}>
                      {x.accName}
                    </option>
                  ))}
                </FormControl>
              </FormGroup>
              <FormGroup
                controlId="accountToId"
                validationState={this.getToAccountValidationState()}
              >
                <ControlLabel>Partner Account</ControlLabel>
                <FormControl
                  componentClass="select"
                  type="text"
                  value={this.state.accountToId}
                  placeholder="Select partner account"
                  onChange={this.handleChange}
                  disabled={
                    this.state.templateType === "Debit" ||
                    this.state.templateType === "Credit"
                  }
                >
                  <option key={0} value={0}>
                    -
                  </option>
                  {this.props.accounts.map(x => (
                    <option key={x.accountId} value={x.accountId}>
                      {x.accName}
                    </option>
                  ))}
                </FormControl>
              </FormGroup>
            </Col>
            <Col sm={6}>
              <FormGroup
                controlId="amount100"
                validationState={this.getAmountValidationState()}
              >
                <ControlLabel>Amount</ControlLabel>
                <InputGroup>
                  <InputGroup.Addon>$</InputGroup.Addon>
                  <FormControl
                    type="text"
                    value={this.state.amount100}
                    placeholder="Enter transaction amount"
                    onChange={this.handleChange}
                    disabled={
                      this.state.templateType === "CC" ||
                      this.state.templateType === "Zero"
                    }
                    onFocus={this.handleFocus}
                  />
                </InputGroup>

                <FormControl.Feedback />
              </FormGroup>
              <FormGroup controlId="periodType" validationState="success">
                <ControlLabel>Period Type</ControlLabel>
                <FormControl
                  componentClass="select"
                  type="text"
                  value={this.state.periodType}
                  placeholder="Select period type"
                  onChange={this.handleChange}
                  disabled={this.state.templateType === "Zero"}
                >
                  <option value="M">Month</option>
                  <option value="w">Week</option>
                  <option value="y">Year</option>
                  <option value="Q">Quarter</option>
                  <option value="d">Day</option>
                </FormControl>
              </FormGroup>
              <FormGroup
                controlId="periodCnt"
                validationState={this.getFreqValidationState()}
              >
                <ControlLabel>Frequency</ControlLabel>
                <FormControl
                  type="text"
                  value={this.state.periodCnt}
                  placeholder="Number of periods"
                  onChange={this.handleChange}
                  onFocus={this.handleFocus}
                  disabled={this.state.templateType === "Zero"}
                />
              </FormGroup>
              <FormGroup
                controlId="periodLastDay"
                validationState={this.getLastPeriodDayValidationState()}
              >
                <ControlLabel>Last Period Day</ControlLabel>
                <FormControl
                  type="text"
                  value={this.state.periodLastDay}
                  placeholder="Last day of the period"
                  onChange={this.handleChange}
                  disabled={this.state.templateType !== "CC"}
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
          </form>
        )}
      </div>
    );
  }
}
