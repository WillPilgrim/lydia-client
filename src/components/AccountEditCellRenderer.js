import React, { Component } from "react";

class AccountEditCellRenderer extends Component {
  constructor(props) {
    super(props);
    this.btnClickedHandler = this.btnClickedHandler.bind(this);
  }
  btnClickedHandler() {
      let accountId = this.props.data.accountId
      this.props.context.componentParent.handleEdit(accountId)
  }
  render() {
    return <button style={{ height: 20, lineHeight: 0.5, width:50}} className="btn btn-primary"
    onClick={this.btnClickedHandler}>Edit</button>;
  }
}

export default AccountEditCellRenderer;