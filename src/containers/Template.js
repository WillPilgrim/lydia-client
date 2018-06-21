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

export default class Template extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: null,
      isDeleting: null,
      template: null,
      description: "",
      amount: ""
    };
  }

  async componentDidMount() {
    try {
      const template = await this.getTemplate();
      const { description, amount } = template;

      this.setState({
        template,
        description,
        amount
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

  deleteTemplate() {
    return API.del("accounts", `/templates/${this.props.match.params.id}`);
  }

  validateForm() {
    return (
      this.getDescriptionValidationState() === "success" &&
      this.getAmountValidationState() === "success"
    );
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  handleSubmit = async event => {
    event.preventDefault();

    this.setState({ isLoading: true });

    try {
      await this.saveTemplate({
        accountFromId: this.state.template.accountFromId,
        accountToId: this.state.template.accountToId,
        templateType: this.state.template.templateType,
        startDate: this.state.template.startDate,
        endDate: this.state.template.endDate,
        numPeriods: this.state.template.numPeriods,
        noEnd: this.state.template.noEnd,
        periodType: this.state.template.periodType,
        periodCnt: this.state.template.periodCnt,
        inflation: this.state.template.inflation,
        ccRelDate: this.state.template.ccRelDate,

        description: this.state.description,
        amount: parseFloat(this.state.amount).toFixed(2)
      });
      this.setState({ isLoading: false });
      //      this.props.history.push("/");
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
              <HelpBlock>A description is required</HelpBlock>
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
                        <HelpBlock>Amount must be a valid decimal value</HelpBlock>
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
