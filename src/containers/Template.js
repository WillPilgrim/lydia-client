import React, { Component } from "react";
import { API } from "aws-amplify";
import {
  FormGroup,
  FormControl,
  ControlLabel,
  HelpBlock,
  InputGroup
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
      amount: "",
      startDate: null,
      endDate: null,
      accountFromId: "",
      templateType: "",
      periodType: "",
      new: ""
    };
  }

  async componentDidMount() {
    try {
      const accs = await this.getAccounts();
      let template;
      if (this.props.match.params.id === 'new') {
        template = this.state;
        template.accountFromId = accs[0];
      } else {
        template = await this.getTemplate();
      }
      const {
        accountFromId,
        description,
        amount,
        startDate,
        endDate,
        templateType,
        periodType
      } = template;

      this.setState({
        accs,
        accountFromId,
        template,
        description,
        amount,
        startDate,
        endDate,
        templateType,
        periodType
      });
    } catch (e) {
      alert(e);
    }
  }

  getAccounts() {
    return API.get("accounts", "/accounts");
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
      this.getAmountValidationState() === "success" &&
      this.getStartDateValidationState() === "success" &&
      this.getEndDateValidationState() !== "error"
    );
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
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

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      const templ = {
        accountToId: this.state.template.accountToId,
        numPeriods: this.state.template.numPeriods,
        noEnd: this.state.template.noEnd,
        periodCnt: this.state.template.periodCnt,
        inflation: this.state.template.inflation,
        ccRelDate: this.state.template.ccRelDate,

        description: this.state.description,
        amount: parseFloat(this.state.amount).toFixed(2),
        startDate: this.state.startDate,
        endDate: this.state.endDate,
        templateType: this.state.templateType,
        periodType: this.state.periodType,
        accountFromId: this.state.accountFromId
      };
      if (this.props.match.params.id === 'new') {
        await this.createTemplate(templ);
      } else {
        await this.saveTemplate(templ);
      }
      this.setState({ isLoading: false });
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
    if (this.state.amount.length === 0) return "error";
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (regex.test(this.state.amount)) return "success";
    return "error";
  }

  getStartDateValidationState() {
    if (this.state.startDate === null) return "error";
    return "success";
  }

  getEndDateValidationState() {
    if (this.state.endDate === null) return "warning";
    if (this.state.startDate === null) return "warning";
    if (Moment(this.state.endDate).isBefore(Moment(this.state.startDate)))
      return "error";
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
            <FormGroup
              controlId="amount"
              validationState={this.getAmountValidationState()}
            >
              <ControlLabel>Amount</ControlLabel>
              <InputGroup>
                <InputGroup.Addon>$</InputGroup.Addon>
                <FormControl
                  type="text"
                  value={this.state.amount}
                  placeholder="Enter transaction amount"
                  onChange={this.handleChange}
                />
              </InputGroup>

              <FormControl.Feedback />
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
              />
            </FormGroup>
            <FormGroup controlId="templateType" validationState="success">
              <ControlLabel>Transaction Type</ControlLabel>
              <FormControl
                componentClass="select"
                type="text"
                value={this.state.templateType}
                placeholder="Select transaction type"
                onChange={this.handleChange}
              >
                <option value="Debit">Debit</option>
                <option value="Credit">Credit</option>
              </FormControl>
            </FormGroup>
            <FormGroup controlId="periodType" validationState="success">
              <ControlLabel>Period Type</ControlLabel>
              <FormControl
                componentClass="select"
                type="text"
                value={this.state.periodType}
                placeholder="Select period type"
                onChange={this.handleChange}
              >
                <option value="Month">Month</option>
                <option value="Week">Week</option>
                <option value="Year">Year</option>
                <option value="Day">Day</option>
              </FormControl>
            </FormGroup>
            <FormGroup controlId="accountFromId" validationState="success">
              <ControlLabel>Source Account</ControlLabel>
              <FormControl
                componentClass="select"
                type="text"
                value={this.state.accountFromId}
                placeholder="Select source account"
                onChange={this.handleChange}
              >{this.state.accs.map(x =>
                <option key={x.accountId} value={x.accountId}>{x.content}</option>
              )}
              </FormControl>
            </FormGroup>
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
