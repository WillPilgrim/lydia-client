import React, { useState } from "react"
import { Alert, Modal, Button } from "react-bootstrap"
import Form from "react-bootstrap/Form"
import DatePicker from "react-datepicker"
import Moment from "moment"
import { useAppContext } from "../libs/contextLib"
import { today } from "../libs/utilities"

const ArchivePopUp = (props) => {
  const { transAcc } = useAppContext()
  const [archiveEndDate, setArchiveEndDate] = useState(today.clone().subtract(1, "d").toDate())
  const [errorMessage, setErrorMessage] = useState(null)
  
  const isValidArchiveEndDate = () => {
    if (archiveEndDate === null) return false
    if (Moment(archiveEndDate).isSameOrAfter(today,"day")) return false
    return true
  }

  const validateForm = () => (
    isValidArchiveEndDate()
  )

  const handleArchive = () => {
    let submit = true
    let msg = ""
    if (!transAcc) 
        submit = false
    else {
        transAcc.forEach(account => {
            account.trans.filter(
                item => !Moment(item.date).isAfter(archiveEndDate, "day")
              ).forEach(tran => {
                if (!tran.reconciled || tran.reconciled < 1) {
                    submit = false
                    msg = ` in account "${account.accName}"`
                }
              })
        })
    }
    if (submit)
        props.onSubmit(archiveEndDate)
    else 
      setErrorMessage(`Some transactions not reconciled${msg}`)
  }

  return (
      <Modal {...props} animation={false}>
          
          <Modal.Header closeButton>
              <Modal.Title>{props.type} Accounts</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Form.Group controlId="archiveEndDate">
                <Form.Label>End Date</Form.Label>
                <div>
                  <DatePicker
                  dateFormat="dd/MM/yyyy" 
                  selected={archiveEndDate}
                  onChange={value => setArchiveEndDate(value)}
                  />
                </div>
            </Form.Group>
            {errorMessage && <AlertDismissible errorMessage={errorMessage} clearError={() => setErrorMessage(null)} />}
          </Modal.Body>
          
          <Modal.Footer>
            <Button variant="outline-secondary" onClick={props.onHide}>Close</Button>
            <Button variant="outline-primary" disabled={!validateForm()} onClick={handleArchive}>{props.type}</Button>
          </Modal.Footer>

      </Modal>
  )
}

const AlertDismissible = props => {
  return (
      <Alert variant="danger" onClose={() => props.clearError()} dismissible>
        {props.errorMessage}
      </Alert>
  )
}

export default ArchivePopUp