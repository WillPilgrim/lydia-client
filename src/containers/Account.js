import React, { useState, useEffect } from "react"
import { API } from "aws-amplify"
import Form from "react-bootstrap/Form"
import { InputGroup, Col  } from "react-bootstrap"
import { useParams, useHistory } from "react-router-dom"
import LoaderButton from "../components/LoaderButton"
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import Moment from "moment"
import { today } from "../libs/utilities"
import DatePicker from "react-datepicker"
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import "./Account.css"

const Account = () => {
  const { refreshAccounts, setRecalcRequired, accounts } = useAppContext()
  const { id } = useParams()
  const history = useHistory()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fields, setFields] = useState({
    openingDate: today.toDate(),
    closingDate: today.clone().add(10, "y").toDate(), // default closing date to 10 years from now
    intFirstAppliedDate: today.toDate(),
    accName: "",
    description: "",
    amount100: "0.00",
    interest: false,
    crRate: 0,
    dbRate: 0,
    periodFrequency: 1,
    periodType: 'M',
    hide: false,
    sortOrder: 0
  })

  const handleFieldChange = event => setFields( fields => ({...fields, [event.target.id]: event.target.value}))
  const setSomeFields = values => setFields(fields => ({...fields, ...values}) )

  useEffect(() => {
    console.log('Account: useEffect')
    
    const loadAccount = () => API.get("accounts", `/accounts/${id}`)
    const onLoad = async () => {
      try {
        setIsLoading(true)
        const acc = await loadAccount()
        setFields({ 
          openingDate: new Date(acc.openingDate), 
          closingDate: new Date(acc.closingDate), 
          intFirstAppliedDate: new Date(acc.intFirstAppliedDate),
          accName: acc.accName, 
          description: acc.description, 
          amount100: (acc.amount / 100).toFixed(2), 
          interest: acc.interest,
          crRate: acc.crRate, 
          dbRate: acc.dbRate, 
          periodFrequency: acc.periodCnt, 
          periodType: acc.periodType, 
          hide: acc.hide, 
          sortOrder: acc.sortOrder 
        })
        setIsLoading(false)
      } catch (e) {
        setIsLoading(false)
        onError(e)
      }
    }

    if (id !== "new") {
      onLoad()
    }
  }, [id])

  const isValidName = () => fields.accName.length > 0

  const isValidDescription = () => fields.description.length > 0

  const isValidOpeningDate = () => {
    if (fields.openingDate === null) return false
    // Bizarre check to make sure opening date not more than 30 years in the future!
    return Moment(fields.openingDate).isBefore(today.clone().add(30, "y"))
  }

  const isValidClosingDate = () => {
    if (fields.closingDate === null || fields.openingDate === null) return false
    if (Moment(fields.closingDate).isBefore(Moment(fields.openingDate), "day")) return false
    // Bizarre check to make sure closing date not more than 30 years in the future!
    return Moment(fields.closingDate).isBefore(today.clone().add(30, "y"))
  }

  const isValidOpeningBalance = () => {
    if (fields.amount100.length === 0) return false
    const regex = /^(-|\+)?[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(fields.amount100)) return false
    const amount = Math.round(parseFloat(fields.amount100).toFixed(2) * 100)
    if (isNaN(amount)) return false
    if (amount > 99999999 || amount < -99999999) return false
    return true
  }

  const isValidRate = (rate) => {
    if (!fields.interest) return true
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(rate)) return false
    const amount = parseFloat(rate).toFixed(2)
    if (isNaN(amount)) return false
    if (amount > 99.99) return false
    return true
  }

  const isValidIntFirstAppliedDate = () => {
    if (!fields.interest) return true
    if (fields.intFirstAppliedDate === null) return false
    if (Moment(fields.intFirstAppliedDate).isAfter(today.clone().add(30, "y"), "day")) return false
    if (Moment(fields.intFirstAppliedDate).isBefore(Moment(fields.openingDate), "day")) return false
    if (Moment(fields.intFirstAppliedDate).isAfter(Moment(fields.closingDate), "day")) return false
    return true
  }

  const isValidPeriodFrequency = () => {
    if (!fields.interest) return true
    if (fields.periodFrequency.length <= 0) return false
    const val = parseInt(fields.periodFrequency, 10)
    if (isNaN(val)) return false
    if (val > 364 || val < 1) return false
    return true
  }

  const isValidPeriodType = () => true

  const validateForm = () => (
    isValidName() &&
    isValidDescription() &&
    isValidOpeningDate() &&
    isValidClosingDate() &&
    isValidOpeningBalance() &&
    isValidRate(fields.crRate) &&
    isValidRate(fields.dbRate) &&
    isValidIntFirstAppliedDate() &&
    isValidPeriodFrequency() &&
    isValidPeriodType()
  )

  const createAccount = account => API.post("accounts", "/accounts", { body: account })
  
  const saveAccount = account => API.put("accounts", `/accounts/${id}`, { body: account })

  const deleteAccount = () => API.del("accounts", `/accounts/${id}`)
  
  const handleFocus = event => event.target.select()
  
  const handleSubmit = async event => {
    event.preventDefault()

    setIsSaving(true)
    
    try {
      const account = {
        accName: fields.accName,
        description: fields.description,
        openingDate: Moment(fields.openingDate).startOf('date').format(),
        closingDate: Moment(fields.closingDate).startOf('date').format(),
        amount: Math.round(parseFloat(fields.amount100) * 100),
        crRate: fields.interest ? parseFloat(fields.crRate).toFixed(2) : 0,
        dbRate: fields.interest ? parseFloat(fields.dbRate).toFixed(2) : 0,
        interest: fields.interest,
        periodType: fields.interest ? fields.periodType : "M",
        periodCnt: fields.interest ? parseInt(fields.periodFrequency, 10) : 1,
        intFirstAppliedDate: Moment(fields.intFirstAppliedDate).startOf('date').format(),

        // sortOrder should be specified in the lambda
        sortOrder: id === "new" ? accounts.length + 1 : fields.sortOrder,
        hide: id === "new" ? false : fields.hide
      }

      id === "new" ? await createAccount(account) : await saveAccount(account)
      
      // not sure about this one - this.props.setTransactions(null)
      await refreshAccounts()
      setRecalcRequired(true)
      history.push("/accounts")
    } catch (e) {
      onError(e)
      setIsSaving(false)
    }
  }

  const handleDelete = async event => {
    event.preventDefault()

    const confirmed = window.confirm( "Are you sure you want to delete this account?" )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount()
      await refreshAccounts()
      setRecalcRequired(true)
      history.push("/accounts")
    } catch (e) {
      onError(e)
      setIsDeleting(false)
    }
  }

  return (
    isLoading ?
      <div>
        Retrieving account data...
      </div>
      :
    <div className="Account">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="accName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={fields.accName}
            placeholder="Enter an account Name"
            onChange={handleFieldChange}
            isValid={isValidName()}
            isInvalid={!isValidName()}
          />
          <Form.Control.Feedback type="invalid">An account name is required.</Form.Control.Feedback>
        </Form.Group>
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
          <Form.Control.Feedback type="invalid">An account description is required.</Form.Control.Feedback>
        </Form.Group>
        <Form.Row>
          <Col>
            <Form.Group controlId="openingDate">
              <Form.Label>Opening Date</Form.Label>
              <div>
                <DatePicker dateFormat="dd/MM/yyyy" selected={fields.openingDate} onChange={date => setSomeFields({openingDate: date})} />
              </div>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="closingDate">
              <Form.Label>Closing Date</Form.Label>
              <div>
                <DatePicker dateFormat="dd/MM/yyyy" selected={fields.closingDate} onChange={date => setSomeFields({closingDate: date})} />
              </div>
            </Form.Group>
          </Col>
        </Form.Row>
        <Form.Group controlId="amount100">
          <Form.Label>Opening Balance</Form.Label>
          <InputGroup className="mb-3">
            <InputGroup.Prepend>
              <InputGroup.Text>$</InputGroup.Text>
            </InputGroup.Prepend>
            <Form.Control
              type="text"
              value={fields.amount100}
              placeholder="Enter an opening balance"
              onChange={handleFieldChange}
              onFocus={handleFocus}
              isValid={isValidOpeningBalance()}
              isInvalid={!isValidOpeningBalance()}
            />
            <Form.Control.Feedback type="invalid">Please enter a valid opening balance amount. Zero or negative opening balances are okay.</Form.Control.Feedback>
          </InputGroup>
        </Form.Group>
        <Form.Group controlId="interest">
          <Form.Label>Interest</Form.Label>
          <Form.Check
            type='checkbox'
            label="Calculate Interest For This Account"
            checked={fields.interest}
            onChange={event => setSomeFields({interest:event.target.checked})}
          />
        </Form.Group>
        <Form.Row>
          <Col>
            <Form.Group controlId="crRate">
              <Form.Label>Opening Credit Rate</Form.Label>
              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={fields.crRate}
                  placeholder="Credit interest rate"
                  onChange={handleFieldChange}
                  disabled={!fields.interest}
                  onFocus={handleFocus}
                  isValid={isValidRate(fields.crRate) && fields.interest}
                  isInvalid={!isValidRate(fields.crRate) && fields.interest}
                />
                <Form.Control.Feedback type="invalid">Please enter a valid, non-negative interest rate. Zero is valid.</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            <Form.Group controlId="dbRate">
              <Form.Label>Opening Debit Rate</Form.Label>
              <InputGroup className="mb-3">
                <InputGroup.Prepend>
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup.Prepend>
                <Form.Control
                  type="text"
                  value={fields.dbRate}
                  placeholder="Debit interest rate"
                  onChange={handleFieldChange}
                  disabled={!fields.interest}
                  onFocus={handleFocus}
                  isValid={isValidRate(fields.dbRate) && fields.interest}
                  isInvalid={!isValidRate(fields.dbRate) && fields.interest}
                />
                <Form.Control.Feedback type="invalid">Please enter a valid, non-negative interest rate. Zero is valid.</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            <Form.Group controlId="intFirstAppliedDate">
              <Form.Label>First Applied Date</Form.Label>
              <div>
                <DatePicker dateFormat="dd/MM/yyyy" selected={fields.intFirstAppliedDate} onChange={date => setSomeFields({intFirstAppliedDate: date})} disabled={!fields.interest} />
              </div>
            </Form.Group>
          </Col>
          <Col>
            <Form.Group controlId="periodType">
              <Form.Label>Period Type</Form.Label>
              <Form.Control
                as="select"
                type="text"
                value={fields.periodType}
                onChange={handleFieldChange}
                disabled={!fields.interest}
                isValid={fields.interest}
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
                disabled={!fields.interest}
                onFocus={handleFocus}
                isValid={isValidPeriodFrequency() && fields.interest}
                isInvalid={!isValidPeriodFrequency() && fields.interest}
              />
              <Form.Control.Feedback type="invalid">Please enter a period frequency from 1 to 364.</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Form.Row>
        {id === "new" ?
          <LoaderButton
            block
            type="submit"
            size="lg"
            variant="outline-primary"
            isLoading={isSaving}
            disabled={!validateForm()}
          >
            Create
          </LoaderButton> :
          <>
            <LoaderButton
              block
              type="submit"
              size="lg"
              variant="outline-primary"
              isLoading={isSaving}
              disabled={!validateForm()}
            >
              Save
            </LoaderButton>
            <LoaderButton
              block
              onClick={handleDelete}
              size="lg"
              variant="outline-danger"
              isLoading={isDeleting}
            >
              Delete
          </LoaderButton>
          </>
        }
      </Form>
    </div>
  )
}

export default Account