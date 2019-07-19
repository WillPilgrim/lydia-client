import React, { Component } from "react";
import {
    Modal,
    FormGroup,
    ControlLabel,
    Button
  } from "react-bootstrap";
//import "./ArchivePopUp.css";
import DatePicker from "react-16-bootstrap-date-picker"
import Moment from "moment"
import { today } from "../libs/utilities";

class ArchivePopUp extends Component {
  constructor(props) {
    super(props);

    this.state = {
      archiveEndDate: today.format()
    };
  }

  validateForm() {
    return (
      this.getArchiveEndDateValidationState() !== "error"
    )
  }

  getArchiveEndDateValidationState() {
    if (this.state.archiveEndDate === null) return "error";
    if (Moment(this.state.archiveEndDate).isSameOrAfter(today,"day"))
      return "error";
    return "success";
  }

  handleArchiveEndDateChange = value => {
    this.setState({
      archiveEndDate: value
    });
  };
  
  handleArchive = () => {
    let submit = true;
    let msg = ""
    let transAcc = this.props.transAcc
    if (!transAcc) 
        submit = false
    else {
        transAcc.forEach(account => {
            account.trans.filter(
                item => !Moment(item.date).isAfter(this.state.archiveEndDate, "day")
              ).forEach(tran => {
                if (!tran.reconciled || tran.reconciled < 1) {
                    submit = false
                    msg = ` in account "${account.accName}"`
                }
              });
        });
    }
    if (submit)
        this.props.onSubmit(this.state.archiveEndDate);
    else
      alert(`Some transactions not reconciled${msg}`)
  }

  render() {

    return (
        <Modal show={this.props.showArchive} onHide={this.props.onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{this.props.type} Accounts</Modal.Title>
            </Modal.Header>
            <Modal.Body>
            <FormGroup
                controlId="archiveEndDate"
                validationState={this.getArchiveEndDateValidationState()}
            >
                <ControlLabel>End Date</ControlLabel>
                <DatePicker
                id="archiveEndDate"
                value={this.state.archiveEndDate}
                placeholder="Date"
                onChange={this.handleArchiveEndDateChange}
                autoComplete="off"
                />
            </FormGroup>
            </Modal.Body>
            <Modal.Footer>
            <Button onClick={this.props.onClose}>Close</Button>
            <Button disabled={!this.validateForm()} bsStyle="primary" onClick={this.handleArchive}>{this.props.type}</Button>
            </Modal.Footer>
        </Modal>
    );
  }
}

export default ArchivePopUp;