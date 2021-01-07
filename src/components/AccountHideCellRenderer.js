import React, { Component } from "react"

class AccountHideCellRenderer extends Component {
  constructor(props) {
    super(props);
    this.btnClickedHandler = this.btnClickedHandler.bind(this);
  }
  async btnClickedHandler() {
      let account =  this.props.data
      account.hide = !account.hide
      await this.props.saveAcc(account)
      await this.props.refreshAcc();
      this.props.recalcReq(true)
      this.props.api.refreshCells({force:true})
  }
  render() {
    let buttonName = "Hide"
    if (this.props.data.hide) buttonName = "Unhide"
    return <button style={{ height: 20, lineHeight: 0.5, width:70}} className="btn btn-primary"
    onClick={this.btnClickedHandler}>{buttonName}</button>;
  }
}

export default AccountHideCellRenderer