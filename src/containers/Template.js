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
  const { accounts, refreshTemplates, templates, setRecalcRequired } = useAppContext()
  const { id } = useParams()
  const history = useHistory()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fields, handleFieldChange, setFieldValues] = useFormFields({
    description: "",
    templateType: "Debit",
    startDate: today.toDate(),
    endDate: today.clone().add(10, "y").toDate(),
    amount100: "0.00",
    accountFromId: accounts ? accounts[0].accountId:"0",
    accountToId: "0",
    periodType: "M",
    periodFrequency: 1,
    periodLastDay: 0,
    inflation: true
  })

  useEffect(() => {
    console.log('Template: useEffect')
    const loadTemplate = () => API.get("accounts", `/templates/${id}`)
    const onLoad = async () => {
      if (id !== "new") {
          try {
          const template = await loadTemplate()
          const { accountFromId, accountToId, description, amount, startDate, endDate, templateType, periodType, periodCnt, periodLastDay, templateId, inflation } = template
          setFieldValues({ templateId, description, templateType,
            startDate: new Date(startDate), 
            endDate: new Date(endDate),
            amount100: (amount / 100).toFixed(2), accountFromId, accountToId,
            periodType, 
            periodFrequency: periodCnt, 
            periodLastDay: periodLastDay ? periodLastDay : 0, 
            inflation:inflation ? inflation : false 
          })
        } catch (e) {
          setIsLoading(false)
          onError(e)
        }
      }
      setIsLoading(false)
    }
    onLoad()
  }, [id])

  const handleTemplateTypeChange = event => {
    const templateType = event.target.value
    // Always reset partner account and last period day when changing type
    let newSet = {[event.target.id]: templateType, accountToId:"0", periodLastDay:0}  
    if (templateType === "CC") {
      Object.assign(newSet, {amount100:"0.00"})
    }
    if (templateType === "Zero") {
      Object.assign(newSet, {periodFrequency:1, endDate:fields.startDate, amount100:"0.00"})
    }
    setFieldValues(newSet)
  }

  const handleStartDateChange = value => {
    let newSet = {startDate:value}
    if (fields.templateType === "Zero")
    {
      Object.assign(newSet, {endDate:value})
    }
    setFieldValues(newSet)
  }

  const isValidDescription = () => fields.description.length > 0

  const isValidAmount = () => {
    if (fields.templateType === "CC" || fields.templateType === "Zero") return true  // don't validate if type doesn't require an amount
    if (fields.amount100.length === 0) return false
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(fields.amount100)) return false
    let amount = Math.round(parseFloat(fields.amount100).toFixed(2) * 100)
    if (isNaN(amount)) return false
    if (amount > 99999999) return false
    if (amount === 0 &&(fields.templateType === "Debit" || 
        fields.templateType === "Credit" || fields.templateType === "Transfer")) return false
    return true
  }

  const isValidPeriodFrequency = () => {
    if (fields.templateType === "Zero") return true
    if (fields.periodFrequency.length <= 0) return false
    let val = parseInt(fields.periodFrequency, 10)
    if (isNaN(val)) return false
    if (val > 364 || val < 1) return false
    return true
  }

  const isValidPeriodLastDay = () => {
    if (fields.templateType !== "CC") return true
    if (fields.periodLastDay.length <= 0) return false
    let val = parseInt(fields.periodLastDay, 10)
    if (isNaN(val)) return false
    if (val < 1 || val > 28) return false
    return true
  }

  // Probably not good enough to assme any non null value is a valid date.
  // Need to check its an actual valid date and to give some reasonable bounds to it.
  const isValidStartDate = () => fields.startDate !== null

  const isValidEndDate = () => {
    if (fields.endDate === null) return true
    if (fields.startDate === null) return true
    if (Moment(fields.endDate).isBefore(Moment(fields.startDate), "day"))
      return false
    return true
  }

  const isValidToAccount = () => {
    let partnerRequired = fields.templateType === "Transfer" || fields.templateType === "CC"
    if (partnerRequired && fields.accountToId === "0") return false // can't have transfer type without account
    let partnerNotAllowed = fields.templateType === "Debit" || fields.templateType === "Credit"
    if (partnerNotAllowed && fields.accountToId !== "0") return false
    if (fields.accountFromId === fields.accountToId) return false // from account equals to account
    return true
  }

  const validateForm = () => (
      isValidDescription() &&
      isValidAmount() &&
      isValidPeriodFrequency() &&
      isValidPeriodLastDay() &&
      isValidStartDate() &&
      isValidEndDate() &&
      isValidToAccount()
  )

  const createTemplate = template => API.post("accounts", "/templates", { body: template })

  const saveTemplate = template => API.put("accounts", `/templates/${id}`, { body: template })
  
  const deleteTemplate = () => API.del("accounts", `/templates/${id}`)

  const handleFocus = event => {
    event.target.select()
  }

  const handleSubmit = async event => {
    event.preventDefault()

    setIsSaving(true)

    if (fields.templateType === "CC") {
      if (templates) {
        if (
          templates.find(x => x.accountFromId === fields.accountFromId && x.templateType === "CC" &&
          fields.templateId !== x.templateId)
        ) {
          alert(
            `Credit card template already exists for account '${
              accounts ? accounts.find(x => x.accountId === fields.accountFromId).accName : ""
            }'`
          )
          return
        }
      }
    }

    try {
      const template = {
        accountFromId: fields.accountFromId,
        accountToId: fields.accountToId,
        amount: Math.round(parseFloat(fields.amount100).toFixed(2) * 100),
        description: fields.description,
        endDate: fields.templateType === "Zero"
            ? Moment(fields.startDate).startOf('date').format()
            : Moment(fields.endDate).startOf('date').format(),
        inflation: fields.inflation,
        periodCnt: parseInt(fields.periodFrequency, 10),
        periodLastDay: parseInt(fields.periodLastDay, 10),
        periodType: fields.periodType,
        startDate: Moment(fields.startDate).startOf('date').format(),
        templateType: fields.templateType
      }

      id === "new" ? await createTemplate(template) : await saveTemplate(template)

      await refreshTemplates()
      setRecalcRequired(true)
      history.push("/templates")
    } catch (e) {
      onError(e)
      setIsSaving(false)
    }
  }

  const handleDelete = async event => {
    event.preventDefault()

    const confirmed = window.confirm( "Are you sure you want to delete this template?" )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteTemplate()
      await refreshTemplates()
      setRecalcRequired(true)
      history.push("/templates")
    } catch (e) {
      onError(e)
      setIsDeleting(false)
    }
  }

  let amountRequired = !(fields.templateType === "CC" || fields.templateType === "Zero")
  let partnerAccountRequired = !(fields.templateType === "Debit" || fields.templateType === "Credit")
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
            isInvalid={!isValidDescription()}
          />
          <Form.Control.Feedback type="invalid">A template description is required.</Form.Control.Feedback>
        </Form.Group>
        <Form.Row>
        <Col>
          <Form.Group controlId="templateType">
            <Form.Label>Transaction Type</Form.Label>
            <Form.Control
              as="select"
              type="text"
              value={fields.templateType}
              onChange={handleTemplateTypeChange}
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
            <div>
              <DatePicker dateFormat="dd/MM/yyyy" selected={fields.startDate} onChange={handleStartDateChange} />
            </div>
          </Form.Group>
          <Form.Group controlId="endDate">
            <Form.Label>End Date</Form.Label>
            <div>
              <DatePicker dateFormat="dd/MM/yyyy" selected={fields.endDate} onChange={date => setFieldValues({endDate:date})} disabled={fields.templateType === "Zero"}/>
            </div>
          </Form.Group>
          <Form.Group controlId="accountFromId">
            <Form.Label>Template Account</Form.Label>
            <Form.Control
              as="select"
              type="text"
              value={fields.accountFromId}
              onChange={handleFieldChange}
            >
              {accounts.map(x => (
                <option key={x.accountId} value={x.accountId}>
                  {x.accName}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="accountToId">
            <Form.Label>Partner Account</Form.Label>
            <Form.Control
              as="select"
              type="text"
              value={fields.accountToId}
              onChange={handleFieldChange}
              disabled={!partnerAccountRequired}
              isValid={partnerAccountRequired && isValidToAccount()}
              isInvalid={partnerAccountRequired && !isValidToAccount()}
          >
              <option key={0} value={0}>
                -
              </option>
              {accounts.map(x => (
                <option key={x.accountId} value={x.accountId}>
                  {x.accName}
                </option>
              ))}
            </Form.Control>
            <Form.Control.Feedback type="invalid">Select partner account. It must not be the template account.</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col>
          <Form.Group controlId="amount100">
            <Form.Label>Amount</Form.Label>
            <InputGroup className="mb-3">
              <InputGroup.Prepend>
                <InputGroup.Text>$</InputGroup.Text>
              </InputGroup.Prepend>
              <Form.Control
                type="text"
                value={fields.amount100}
                placeholder={amountRequired ? "Enter transaction amount" : ""}
                onChange={handleFieldChange}
                disabled={!amountRequired}
                onFocus={handleFocus}
                isValid={amountRequired && isValidAmount()}
                isInvalid={amountRequired && !isValidAmount()}
              />
              <Form.Control.Feedback type="invalid">Please enter a valid transaction amount.</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
          <Form.Group controlId="periodType">
            <Form.Label>Period Type</Form.Label>
            <Form.Control
              as="select"
              type="text"
              value={fields.periodType}
              onChange={handleFieldChange}
              disabled={fields.templateType === "Zero"}
              isValid={!fields.templateType === "Zero"}
            >
              <option value="M">Month</option>
              <option value="w">Week</option>
              <option value="y">Year</option>
              <option value="Q">Quarter</option>
              <option value="d">Day</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="periodFrequency">
            <Form.Label>Frequency</Form.Label>
            <Form.Control
              type="text"
              value={fields.periodFrequency}
              placeholder="Number of periods"
              onChange={handleFieldChange}
              disabled={fields.templateType === "Zero"}
              onFocus={handleFocus}
              isValid={isValidPeriodFrequency() && !fields.templateType === "Zero"}
              isInvalid={!isValidPeriodFrequency() && !fields.templateType === "Zero"}
            />
            <Form.Control.Feedback type="invalid">Please enter a period frequency from 1 to 364.</Form.Control.Feedback>
          </Form.Group>
          <Form.Group
            controlId="periodLastDay">
            <Form.Label>Last Period Day</Form.Label>
            <Form.Control
              type="text"
              value={fields.periodLastDay}
              placeholder="Last day of the period"
              onChange={handleFieldChange}
              disabled={fields.templateType !== "CC"}
              onFocus={handleFocus}
              isValid={isValidPeriodLastDay() && fields.templateType === "CC"}
              isInvalid={!isValidPeriodLastDay() && fields.templateType === "CC"}
            />
            <Form.Control.Feedback type="invalid">Please enter a period last day from 1 to 28.</Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="inflation">
            <Form.Label>Inflation</Form.Label>
            <Form.Check
            type='checkbox'
            label="Apply annual inflation rate"
            checked={fields.inflation}
            onChange={event => setFieldValues({inflation:event.target.checked})}
          />
          </Form.Group>
        </Col>
        </Form.Row>
        {id === "new" ?
          <LoaderButton
          block
          type="submit"
          size="lg"
          variant="primary"
          isLoading={isSaving || isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton> :
        <>
          <LoaderButton
            block
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isSaving || isLoading}
            disabled={!validateForm()}
          >
            Save
          </LoaderButton>
          <LoaderButton
            block
            onClick={handleDelete}
            size="lg"
            variant="danger"
            isLoading={isDeleting || isLoading}
          >
            Delete
          </LoaderButton>
        </>
        }
      </Form>
    </div>
  )
}

export default Template