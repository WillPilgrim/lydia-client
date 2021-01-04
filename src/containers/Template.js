import React, { useState, useEffect } from "react"
import { API } from "aws-amplify"
import Form from "react-bootstrap/Form"
import { InputGroup, Col } from "react-bootstrap"
import { useParams, useHistory } from "react-router-dom"
import LoaderButton from "../components/LoaderButton"
import { useFormFields } from "../libs/hooksLib"
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import Moment from "moment"
import { today } from "../libs/utilities"
import DatePicker from "react-datepicker"
import "./Template.css"

const Template = () => {
  const { refreshTemplates } = useAppContext()
  const { id } = useParams()
  const history = useHistory()
  const [interest, setInterest] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [startDate, setStartDate] = useState(today.toDate())
  const [endDate, setEndDate] = useState(today.clone().add(10, "y").toDate()) // default closing date to 10 years from now
  const [fields, handleFieldChange, setValues] = useFormFields({
    description: "",
    amount100: "0.00",
    accountFromId: "",
    accountToId: "0",
    templateType: "Debit",
    periodType: "M",
    periodFrequency: 1,
    periodLastDay: 0,
    inflation: true
  })

  useEffect(() => {
    const loadTemplate = () => API.get("accounts", `/templates/${id}`)
    const onLoad = async () => {
      try {
        setIsLoading(true)
        const template = await loadTemplate()
        const { accountFromId, accountToId, description, amount, startDate, endDate, templateType, periodType, periodCnt, periodLastDay, templateId, inflation } = template

        setStartDate(new Date(startDate))
        setEndDate(new Date(endDate))
        setValues({ description, amount100: (amount / 100).toFixed(2), accountFromId, accountToId,
          templateType, periodType, periodFrequency: periodCnt, 
          periodLastDay: periodLastDay ? periodLastDay : 0, 
          inflation:inflation ? inflation : false })
        setIsLoading(false)
      } catch (e) {
        setIsLoading(false)
        onError(e)
      }
    }

    if (id !== "new") {
      onLoad()
    }
  }, [id, setValues])

  const handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  const handleInflationChange = event => {
    this.setState({
      inflation: event.target.checked
    });
  };

  const handleTypeChange = event => {
    this.setState({
      [event.target.id]: event.target.value,
      accountToId: "0"
    });
  };

  const handleStartDateChange = value => {
    if (this.state.templateType === "Zero")
    {
      this.setState({
        startDate: value,
        endDate: value
      });
    }
    else
    {
      this.setState({
        startDate: value
      });
    }
  };

  const handleEndDateChange = value => {
    this.setState({
      endDate: value
    });
  };




  const isValidDescription = () => fields.description.length > 0

  const getAmountValidationState = () => {
    if (this.state.amount100.length === 0) return "error";
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (regex.test(this.state.amount100)) return "success";
    return "error";
  }

  const getFreqValidationState = () => {
    if (this.state.periodCnt.length <= 0) return "error";
    if (isNaN(parseInt(this.state.periodCnt, 10))) return "error";
    else return "success";
  }

  const getLastPeriodDayValidationState = () => {
    if (this.state.templateType !== "CC") return "success";
    if (this.state.periodLastDay.length === 0) return "error";
    if (isNaN(parseInt(this.state.periodLastDay, 10))) return "error";
    let val = parseInt(this.state.periodLastDay, 10);
    if (val < 1 || val > 28) return "error";
    return "success";
  }

  const getStartDateValidationState = () => {
    if (this.state.startDate === null) return "error";
    return "success";
  }

  const getEndDateValidationState = () => {
    if (this.state.endDate === null) return "warning";
    if (this.state.startDate === null) return "warning";
    if (
      Moment(this.state.endDate).isBefore(Moment(this.state.startDate), "day")
    )
      return "error";
    return "success";
  }

  const getToAccountValidationState = () => {
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

  const validateForm = () => (
      isValidDescription &&
      getFreqValidationState() === "success" &&
      getAmountValidationState() === "success" &&
      getStartDateValidationState() === "success" &&
      getEndDateValidationState() !== "error" &&
      getToAccountValidationState() === "success" &&
      getLastPeriodDayValidationState() !== "error"
  )

  const createTemplate = template => API.post("accounts", "/templates", { body: template })

  const saveTemplate = template => API.put("accounts", `/templates/${id}`, { body: template })
  
  const deleteTemplate = () => API.del("accounts", `/templates/${id}`)

  const handleFocus = event => {
    event.target.select()
  }

  const handleSubmit = async event => {
    event.preventDefault()

    if (this.state.templateType === "CC") {
      if (this.props.templates) {
        if (
          this.props.templates.find(x => x.accountFromId === this.state.accountFromId && x.templateType === "CC" &&
          this.state.templateId !== x.templateId)
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

        description: this.state.description,
        amount: Math.round(parseFloat(this.state.amount100).toFixed(2) * 100),
        startDate: Moment(this.state.startDate).startOf('date').format(),
        endDate:
          this.state.templateType === "Zero"
            ? Moment(this.state.startDate).startOf('date').format()
            : Moment(this.state.endDate).startOf('date').format(),
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
        accountToId: this.state.accountToId,
        inflation: this.state.inflation
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
  }

  const handleDelete = async event => {
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
  }

  return (
    isLoading ?
    <div>
      Retrieving template data...
    </div>
    :
    <div className="Template">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="description">
          <Form.Label>Description</Form.Label>
          <Form.Control
            type="text"
            value={fields.description}
            placeholder="Enter a description"
            onChange={handleFieldChange}
            isValid={isValidDescription()}
          />
        </Form.Group>
        <Form.Row>
        <Col>
          <Form.Group controlId="templateType">
            <Form.Label>Transaction Type</Form.Label>
            <Form.Control
              as="select"
              type="text"
              value={fields.templateType}
              onChange={handleFieldChange}
            >
              <option value="Debit">Debit</option>
              <option value="Credit">Credit</option>
              <option value="Transfer">Transfer</option>
              <option value="CC">Credit Card</option>
              <option value="Minimise">Minimise</option>
              <option value="Zero">Zero</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="startDate">
            <Form.Label>Start Date</Form.Label>
            <DatePicker
              id="startDate"
              value={this.state.startDate}
              placeholder="Start date"
              onChange={this.handleStartDateChange}
              autoComplete="off"
            />
          </Form.Group>
          <Form.Group controlId="endDate">
            <Form.Label>End Date</Form.Label>
            <DatePicker
              id="endDate"
              value={this.state.endDate}
              placeholder="End date"
              onChange={this.handleEndDateChange}
              autoComplete="off"
              disabled={this.state.templateType === "Zero"}
            />
          </Form.Group>
          <Form.Group controlId="accountFromId">
            <Form.Label>Template Account</Form.Label>
            <Form.Control
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
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="accountToId">
            <Form.Label>Partner Account</Form.Label>
            <Form.Control
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
            </Form.Control>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group controlId="amount100">
            <Form.Label>Amount</Form.Label>
            <InputGroup>
              <InputGroup.Addon>$</InputGroup.Addon>
              <Form.Control
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

            <Form.Control.Feedback />
          </Form.Group>
          <Form.Group controlId="periodType">
            <Form.Label>Period Type</Form.Label>
            <Form.Control
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
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="periodCnt">
            <Form.Label>Frequency</Form.Label>
            <Form.Control
              type="text"
              value={this.state.periodCnt}
              placeholder="Number of periods"
              onChange={this.handleChange}
              onFocus={this.handleFocus}
              disabled={this.state.templateType === "Zero"}
            />
          </Form.Group>
          <Form.Group
            controlId="periodLastDay">
            <Form.Label>Last Period Day</Form.Label>
            <Form.Control
              type="text"
              value={this.state.periodLastDay}
              placeholder="Last day of the period"
              onChange={this.handleChange}
              disabled={this.state.templateType !== "CC"}
              onFocus={this.handleFocus}
            />
          </Form.Group>
          <Form.Group controlId="inflation">
            <Form.Label>Inflation</Form.Label>
            {/* <Checkbox
              checked={this.state.inflation}
              onChange={this.handleInflationChange}
            >
              Apply annual inflation rate
            </Checkbox> */}
          </Form.Group>
        </Col>
        </Form.Row>
        <LoaderButton
          block
          type="submit"
          size="lg"
          variant="primary"
          isSaving={isSaving}
          disabled={!validateForm()}
        >
          Save
        </LoaderButton>
        <LoaderButton
          block
          onClick={handleDelete}
          size="lg"
          variant="danger"
          isSaving={isDeleting}
        >
          Delete
        </LoaderButton>
      </Form>
    </div>
  )
}

export default Template