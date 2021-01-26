import React from "react"
import { Modal, Button } from "react-bootstrap"

const Confirm = ({ confirmText = "Ok",
                   body = "Saved Successfully",
                   cancelText = "Close",
                   cancelStyle = "outline-secondary",
                   confirmStyle = "outline-primary",
                   closeButton = false,
                   showCancelButton = false,
                ...props }) => 
{

    const onClose = () => {
        if (props.onHide) props.onHide()
        else props.setShow(false)
    }

    const onConfirm = () => {
        if (props.onSubmit) props.onSubmit()
        else props.setShow(false)
    }

    return (
        <Modal onHide={onClose} {...props}>

            <Modal.Header closeButton={closeButton}>
                <Modal.Title>{props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{body}</Modal.Body>
            <Modal.Footer>
                {showCancelButton &&
                    <Button variant={cancelStyle} onClick={onClose}>{cancelText}</Button>}
                <Button variant={confirmStyle} onClick={onConfirm}>{confirmText}</Button>
            </Modal.Footer>

        </Modal>
    )
}

export default Confirm