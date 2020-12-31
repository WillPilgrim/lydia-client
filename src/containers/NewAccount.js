import React, { useState } from "react"
import { API } from "aws-amplify"
import Form from "react-bootstrap/Form"
import { InputGroup, Col, Row } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import LoaderButton from "../components/LoaderButton"
import { useFormFields } from "../libs/hooksLib"
import { onError } from "../libs/errorLib"
import Moment from "moment"
import { today } from "../libs/utilities"
import DatePicker from "react-datepicker"
import 'react-datepicker/dist/react-datepicker-cssmodules.css'
import "./NewAccount.css"

export default () => {
  const history = useHistory()
  const [openingDate, setOpeningDate] = useState(today.toDate())
  const [closingDate, setClosingDate] = useState(today.clone().add(10, "y").toDate()) // default closing date to 10 years from now
  const [intFirstAppliedDate, setIntFirstAppliedDate] = useState(today.toDate())
  const [interest, setInterest] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fields, handleFieldChange] = useFormFields({
    accName: "",
    description: "",
    amount100: "0.00",
    interest: false,
    crRate: 0,
    dbRate: 0,
    periodFrequency: 1,
    periodType: 'M'
  })

  const isValidName = () => fields.accName.length > 0
  const isValidDescription = () => fields.description.length > 0
  const isValidOpeningDate = () => {
    if (openingDate === null) return false
    // Bizarre check to make sure opening date not more than 30 years in the future!
    return Moment(openingDate).isBefore(today.clone().add(30, "y"))  
  }
  const isValidClosingDate = () => {
    if (closingDate === null || openingDate === null) return false
    if (Moment(closingDate).isBefore(Moment(openingDate),"day")) return false
    // Bizarre check to make sure closing date not more than 30 years in the future!
    return Moment(closingDate).isBefore(today.clone().add(30, "y"))  
  }
  
  const isValidOpeningBalance = () => {
    if (fields.amount100.length === 0) return false
    const regex = /^(-|\+)?[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(fields.amount100)) return false
    let amount = Math.round(parseFloat(fields.amount100).toFixed(2) * 100)
    if (isNaN(amount)) return false
    if (amount > 99999999 || amount < -99999999) return false
    return true
  }

  const isValidRate = (rate) => {
    if (!interest) return true
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/
    if (!regex.test(rate)) return false
    let amount = parseFloat(rate).toFixed(2)
    if (isNaN(amount)) return false
    if (amount > 99.99) return false
    return true
  }

  const isValidIntFirstAppliedDate = () => {
    if (!interest) return true
    if (intFirstAppliedDate === null) return false
    if (Moment(intFirstAppliedDate).isAfter(today.clone().add(30, "y"),"day")) return false
    if (Moment(intFirstAppliedDate).isBefore(Moment(openingDate),"day")) return false
    if (Moment(intFirstAppliedDate).isAfter(Moment(closingDate),"day")) return false
    return true
  }

  const isValidPeriodFrequency = () => {
    if (!interest) return true
    if (fields.periodFrequency.length <= 0) return false
    let val = parseInt(fields.periodFrequency, 10)
    if (isNaN(val)) return false
    if (val > 99 || val < 1) return false
    return true
  }
  
  const isValidPeriodType = () => {
    // here for possible expansion of rules
    if (!interest) return true
    return true
  }

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

  const handleFocus = event => {
    event.target.select()
  }
  
  const handleSubmit = async (event) => {
    event.preventDefault()

    setIsLoading(true)
    try {
      await createAccount({
        accName: fields.accName,
        description: fields.description,
        openingDate: Moment(openingDate).startOf('date').format(),
        closingDate: Moment(closingDate).startOf('date').format(),
        amount: Math.round(parseFloat(fields.amount100) * 100),
        crRate: interest ? parseFloat(fields.crRate).toFixed(2) : 0,
        dbRate: interest ? parseFloat(fields.dbRate).toFixed(2) : 0,
        interest: interest,
        periodType: interest ? fields.periodType : "M",
        periodCnt: interest ? parseInt(fields.periodCnt, 10) : 1,
        intFirstAppliedDate: Moment(intFirstAppliedDate).startOf('date').format(),

        // this should be done in the lambda
        //      sortOrder: this.props.accounts.length + 1,
        hide: false
      })
     // this.props.setTransactions(null)
      // Needs to be worked out in context refresh
      // await this.props.refreshAccounts();
      this.props.setRecalcRequired(true)
      history.push("/");
    } catch (e) {
      onError(e)
      setIsLoading(false)
    }

  }

  const createAccount = (account) => {
    return API.post("accounts", "/accounts", {
      body: account
    })
  }

  return (
    <div className="NewAccount">
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="accName">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            value={fields.accName}
            placeholder="Enter an account Name"
            onChange={handleFieldChange}
            isValid={isValidName()}
          />
        </Form.Group>
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
        <Form.Group controlId="openingDate">
          <Form.Label>Opening Date</Form.Label>
          <div>
            <DatePicker dateFormat="dd/MM/yyyy" selected={openingDate} onChange={date => setOpeningDate(date)} />
          </div>
        </Form.Group>
        <Form.Group controlId="closingDate">
          <Form.Label>Closing Date</Form.Label>
          <div>
            <DatePicker dateFormat="dd/MM/yyyy" selected={closingDate} onChange={date => setClosingDate(date)} />
          </div>
        </Form.Group>
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
            checked={interest}
            onChange={event => setInterest(event.target.checked)} 
          />
              
        </Form.Group> 
        <Row>
          <Col>
            <Form.Group  controlId="crRate">
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
                  disabled={!interest}
                  onFocus={handleFocus}
                  isValid={isValidRate(fields.crRate) && interest}
                  isInvalid={!isValidRate(fields.crRate) && interest}
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
                  disabled={!interest}
                  onFocus={handleFocus}
                  isValid={isValidRate(fields.dbRate) && interest}
                  isInvalid={!isValidRate(fields.dbRate) && interest}
                />
                <Form.Control.Feedback type="invalid">Please enter a valid, non-negative interest rate. Zero is valid.</Form.Control.Feedback>
              </InputGroup>
            </Form.Group>
            <Form.Group controlId="intFirstAppliedDate">
              <Form.Label>First Applied Date</Form.Label>
              <div>
                <DatePicker dateFormat="dd/MM/yyyy" selected={intFirstAppliedDate} onChange={date => setIntFirstAppliedDate(date)} disabled={!interest} />
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
                disabled={!interest}
                isValid={interest}
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
                disabled={!interest}
                onFocus={handleFocus}
                isValid={isValidPeriodFrequency() && interest}
                isInvalid={!isValidPeriodFrequency() && interest}
              />
              <Form.Control.Feedback type="invalid">Please enter a period frequency between 1 and 99.</Form.Control.Feedback>
            </Form.Group>
          </Col>  
        </Row>

        <LoaderButton
          block
          type="submit"
          size="lg"
          variant="primary"
          isLoading={isLoading}
          disabled={!validateForm()}
        >
          Create
        </LoaderButton>
      </Form>
    </div>
  )
}

// import React, { Component } from "react"
// import { API } from "aws-amplify";
// import {
//   InputGroup,
//   Col
// } from "react-bootstrap";
// import Form from "react-bootstrap/Form"
// import LoaderButton from "../components/LoaderButton";
// import "./NewAccount.css";
// import DatePicker from "react-datepicker";
// import Moment from "moment";
// import { today } from "../libs/utilities";

// export default class NewAccount extends Component {
//   constructor(props) {
//     super(props);

//     fields = {
//       isLoading: null,
//       description: "",
//       openingDate: today.format(),
//       intFirstAppliedDate: today.format(),
//       closingDate: today.clone()
//         .add(10, "y")
//         .format(), // default closing date to 10 years from now
//       accName: "",
//       amount100: "0.00",
//       crRate: 0,
//       dbRate: 0,
//       periodType: 'M',
//       periodCnt: 1,
//       interest: false,
//       hide: false
//     };
//   }

//   createAccount(account) {
//     return API.post("accounts", "/accounts", {
//       body: account
//     });
//   }

//   validateForm() {
//     return (
//       this.getCrRateValidationState() !== "error" &&
//       this.getDbRateValidationState() !== "error" &&
//       this.getAmountValidationState() === "success" &&
//       this.getDescriptionValidationState() === "success" &&
//       this.getNameValidationState() === "success" &&
//       this.getOpeningDateValidationState() === "success" &&
//       this.getClosingDateValidationState() !== "error" &&
//       this.getFreqValidationState() !== "error" &&
//       this.getFirstAppliedDateValidationState() !== "error" &&
//       this.getPeriodTypeValidationState() !== "error"
//     );
//   }

//   getFreqValidationState() {
//     if (!fields.interest) return "warning";
//     if (fields.periodCnt.length <= 0) return "error";
//     if (isNaN(parseInt(fields.periodCnt, 10)))
//       return "error";
//     let val = parseInt(this.state.periodCnt, 10);
//     if (val > 99 || val < 1)
//       return "error";
//     return "success";
//   }

//   getPeriodTypeValidationState() {
//     if (!this.state.interest) return "warning";
//     return "success";
//   }

//   getDescriptionValidationState() {
//     if (this.state.description.length > 0) return "success";
//     return "error";
//   }

//   getNameValidationState() {
//     if (this.state.accName.length > 0) return "success";
//     return "error";
//   }

//   getOpeningDateValidationState() {
//     if (this.state.openingDate === null) return "error";
//     if (Moment(this.state.openingDate).isAfter(today.clone().add(30, "y")))
//       return "error";
//     return "success";
//   }

//   getFirstAppliedDateValidationState() {
//     if (!this.state.interest) return "warning";
//     if (this.state.intFirstAppliedDate === null) return "error";
//     if (Moment(this.state.intFirstAppliedDate).isAfter(today.clone().add(30, "y"),"day"))
//       return "error";
//     if (Moment(this.state.intFirstAppliedDate).isBefore(Moment(this.state.openingDate),"day"))
//       return "error";
//     if (Moment(this.state.intFirstAppliedDate).isAfter(Moment(this.state.closingDate),"day"))
//       return "error";
//     return "success";
//   }

//   getClosingDateValidationState() {
//     if (this.state.closingDate === null) return "warning";
//     if (this.state.openingDate === null) return "warning";
//     if (Moment(this.state.closingDate).isBefore(Moment(this.state.openingDate),"day"))
//       return "error";
//     if (Moment(this.state.closingDate).isAfter(today.clone().add(30, "y"),"day"))
//       return "error";
//     return "success";
//   }

//   getAmountValidationState() {
//     if (this.state.amount100.length === 0) return "error";
//     const regex = /^(-|\+)?[0-9]+(\.[0-9]{1,2})?$/;
//     if (!regex.test(this.state.amount100)) return "error";
//     let amount = Math.round(parseFloat(this.state.amount100).toFixed(2) * 100);
//     if (isNaN(amount)) return "error";
//     if (amount > 99999999 || amount < -99999999) return "error";
//     return "success";
//   }

//   getCrRateValidationState() {
//     if (!this.state.interest) return "warning";
//     const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
//     if (!regex.test(this.state.crRate)) return "error";
//     let amount = parseFloat(this.state.crRate).toFixed(2);
//     if (isNaN(amount)) return "error";
//     if (amount > 99.99) return "error";
//     return "success";
//   }

//   getDbRateValidationState() {
//     if (!this.state.interest) return "warning";
//     const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
//     if (!regex.test(this.state.dbRate)) return "error";
//     let amount = parseFloat(this.state.dbRate).toFixed(2);
//     if (isNaN(amount)) return "error";
//     if (amount > 99.99) return "error";
//     return "success";
//   }

//   handleChange = event => {
//     this.setState({
//       [event.target.id]: event.target.value
//     });
//   };

//   handleInterestChange = event => {
//     this.setState({
//       interest: event.target.checked
//     });
//   };

//   handleOpeningDateChange = value => {
//     this.setState({
//       openingDate: value
//     });
//   };

//   handleClosingDateChange = value => {
//     this.setState({
//       closingDate: value
//     });
//   };

//   handleFirstAppliedDateChange = value => {
//     this.setState({
//       intFirstAppliedDate: value
//     });
//   };

//   handleSubmit = async event => {
//     event.preventDefault();

//     this.setState({ isLoading: true });

//     try {
//       await this.createAccount({
//         accName: this.state.accName,
//         description: this.state.description,
//         openingDate: Moment(this.state.openingDate).startOf('date').format(),
//         closingDate: Moment(this.state.closingDate).startOf('date').format(),
//         amount: Math.round(parseFloat(this.state.amount100) * 100),
//         crRate: this.state.interest ? parseFloat(this.state.crRate).toFixed(2) : 0,
//         dbRate: this.state.interest ? parseFloat(this.state.dbRate).toFixed(2) : 0,
//         interest: this.state.interest,
//         periodType: this.state.interest ? this.state.periodType : "M",
//         periodCnt: this.state.interest ? parseInt(this.state.periodCnt, 10) : 1,
//         intFirstAppliedDate: Moment(this.state.intFirstAppliedDate).startOf('date').format(),
//         sortOrder: this.props.accounts.length + 1,
//         hide: this.state.hide
//       });
//      // this.props.setTransactions(null)
//       await this.props.refreshAccounts();
//       this.props.setRecalcRequired(true)
//       this.props.history.push("/");
//     } catch (e) {
//       alert(e);
//       this.setState({ isLoading: false });
//     }
//   }

//   handleFocus = event => {
//     event.target.select();
//   }

//   render() {
//     return (
//       <div className="NewAccount">
//         <form onSubmit={this.handleSubmit}>
          // <Form.Group
          //   controlId="accName"
          //   validationState={this.getNameValidationState()}
          // >
          //   <Form.Label>Name</Form.Label>
          //   <Form.Control
          //     value={this.state.accName}
          //     placeholder="Enter an account Name"
          //     onChange={this.handleChange}
          //   />
          //   <Form.Control.Feedback />
          // </Form.Group>
          // <Form.Group
          //   controlId="description"
          //   validationState={this.getDescriptionValidationState()}
          // >
          //   <Form.Label>Description</Form.Label>
          //   <Form.Control
          //     onChange={this.handleChange}
          //     value={this.state.description}
          //     componentClass="textarea"
          //     placeholder="Enter a description"
          //   />
          //   <Form.Control.Feedback />
          // </Form.Group>
          // <Form.Group
          //   controlId="openingDate"
          //   validationState={this.getOpeningDateValidationState()}
          // >
          //   <Form.Label>Opening Date</Form.Label>
          //   <DatePicker
          //     id="openingDate"
          //     value={this.state.openingDate}
          //     placeholder="Opening date"
          //     onChange={this.handleOpeningDateChange}
          //     autoComplete="off"
          //   />
          // </Form.Group>
          // <Form.Group
          //   controlId="closingDate"
          //   validationState={this.getClosingDateValidationState()}
          // >
          //   <Form.Label>Closing Date</Form.Label>
          //   <DatePicker
          //     id="closingDate"
          //     value={this.state.closingDate}
          //     placeholder="Closing date"
          //     onChange={this.handleClosingDateChange}
          //     autoComplete="off"
          //   />
          // </Form.Group>
          // <Form.Group
          //   controlId="amount100"
          //   validationState={this.getAmountValidationState()}
          // >
          //   <Form.Label>Opening Balance</Form.Label>
          //   <InputGroup>
          //     <InputGroup.Addon>$</InputGroup.Addon>
          //     <Form.Control
          //       type="text"
          //       value={this.state.amount100}
          //       placeholder="Enter an opening balance"
          //       onChange={this.handleChange}
          //       onFocus={this.handleFocus}
          //     />
          //   </InputGroup>
          //   <Form.Control.Feedback />
          // </Form.Group>
          // <Form.Group controlId="interest" validationState="success">
          //   <Form.Label>Interest</Form.Label>
          //   {/* <Checkbox
          //     checked={this.state.interest}
          //     onChange={this.handleInterestChange}
          //   >
          //     Calculate Interest For This Account
          //   </Checkbox> */}
          // </Form.Group>

          // <Col sm={6}>

          //   <Form.Group
          //     controlId="crRate"
          //     validationState={this.getCrRateValidationState()}
          //   >
          //     <Form.Label>Opening Credit Rate</Form.Label>
          //     <InputGroup>
          //       <InputGroup.Addon>%</InputGroup.Addon>
          //       <Form.Control
          //         type="text"
          //         value={this.state.crRate}
          //         placeholder="Credit interest rate"
          //         onChange={this.handleChange}
          //         disabled={!this.state.interest}
          //         onFocus={this.handleFocus}
          //       />
          //     </InputGroup>
          //     <Form.Control.Feedback />
          //   </Form.Group>
          //   <Form.Group
          //     controlId="dbRate"
          //     validationState={this.getDbRateValidationState()}
          //   >
          //     <Form.Label>Opening Debit Rate</Form.Label>
          //     <InputGroup>
          //       <InputGroup.Addon>%</InputGroup.Addon>
          //       <Form.Control
          //         type="text"
          //         value={this.state.dbRate}
          //         placeholder="Debit interest rate"
          //         onChange={this.handleChange}
          //         disabled={!this.state.interest}
          //         onFocus={this.handleFocus}
          //       />
          //     </InputGroup>
          //     <Form.Control.Feedback />
          //   </Form.Group>
          //   <Form.Group
          //     controlId="intFirstAppliedDate"
          //     validationState={this.getFirstAppliedDateValidationState()}
          //   >
          //     <Form.Label>First Applied Date</Form.Label>
          //     <DatePicker
          //       id="intFirstAppliedDate"
          //       value={this.state.intFirstAppliedDate}
          //       placeholder="First Applied Date"
          //       onChange={this.handleFirstAppliedDateChange}
          //       autoComplete="off"
          //       disabled={!this.state.interest}
          //     />
          //   </Form.Group>
          // </Col>
          // <Col sm={6}>

          //   <Form.Group controlId="periodType" validationState={this.getPeriodTypeValidationState()}>
          //     <Form.Label>Period Type</Form.Label>
          //     <Form.Control
          //       componentClass="select"
          //       type="text"
          //       value={this.state.periodType}
          //       placeholder="Select period type"
          //       onChange={this.handleChange}
          //       disabled={!this.state.interest}
          //     >
          //       <option value="M">Month</option>
          //       <option value="w">Week</option>
          //       <option value="y">Year</option>
          //       <option value="Q">Quarter</option>
          //       <option value="d">Day</option>
          //     </Form.Control>
          //   </Form.Group>

          //   <Form.Group controlId="periodCnt" validationState={this.getFreqValidationState()}>
          //     <Form.Label>Frequency</Form.Label>
          //     <Form.Control
          //       type="text"
          //       value={this.state.periodCnt}
          //       placeholder="Number of periods"
          //       onChange={this.handleChange}
          //       disabled={!this.state.interest}
          //     />
          //   </Form.Group>

          // </Col>
          
//           <LoaderButton
//             block
//             bsStyle="primary"
//             bsSize="large"
//             disabled={!this.validateForm()}
//             type="submit"
//             isLoading={this.state.isLoading}
//             text="Create"
//             loadingText="Creating…"
//           />
//         </form>
//       </div>
//     );
//   }
// }
