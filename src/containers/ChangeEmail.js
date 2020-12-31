import React, { Component } from "react"
import { Auth } from "aws-amplify"
import Form from "react-bootstrap/Form"
import LoaderButton from "../components/LoaderButton"
import "./ChangeEmail.css"

export default class ChangeEmail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      code: "",
      email: "",
      codeSent: false,
      isConfirming: false,
      isSendingCode: false
    };
  }

  validatEmailForm() {
    return this.state.email.length > 0;
  }

  validateConfirmForm() {
    return this.state.code.length > 0;
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  handleUpdateClick = async event => {
    event.preventDefault();

    this.setState({ isSendingCode: true });

    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, { email: this.state.email });

      this.setState({ codeSent: true });
    } catch (e) {
      alert(e.message);
      this.setState({ isSendingCode: false });
    }
  };

  handleConfirmClick = async event => {
    event.preventDefault();

    this.setState({ isConfirming: true });

    try {
      await Auth.verifyCurrentUserAttributeSubmit("email", this.state.code);
      this.props.userHasAuthenticated(true, this.state.email);
      this.props.history.push("/settings");
    } catch (e) {
      alert(e.message);
      this.setState({ isConfirming: false });
    }
  };

  renderUpdateForm() {
    return (
      <form onSubmit={this.handleUpdateClick}>
        <Form.Group bsSize="large" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            autoFocus
            type="email"
            value={this.state.email}
            onChange={this.handleChange}
          />
        </Form.Group>
        <LoaderButton
          block
          type="submit"
          bsSize="large"
          text="Update Email"
          loadingText="Updating…"
          disabled={!this.validatEmailForm()}
          isLoading={this.state.isSendingCode}
        />
      </form>
    );
  }

  renderConfirmationForm() {
    return (
      <form onSubmit={this.handleConfirmClick}>
        <Form.Group bsSize="large" controlId="code">
          <Form.Label>Confirmation Code</Form.Label>
          <Form.Control
            autoFocus
            type="tel"
            value={this.state.code}
            onChange={this.handleChange}
          />
          <Form.Text muted>Please check your email ({this.state.email}) for the confirmation code.</Form.Text>
        </Form.Group>
        <LoaderButton
          block
          type="submit"
          bsSize="large"
          text="Confirm"
          loadingText="Confirm…"
          isLoading={this.state.isConfirming}
          disabled={!this.validateConfirmForm()}
        />
      </form>
    );
  }

  render() {
    return (
      <div className="ChangeEmail">
        {!this.state.codeSent
          ? this.renderUpdateForm()
          : this.renderConfirmationForm()}
      </div>
    );
  }
}