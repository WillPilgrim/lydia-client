import React, { Component } from "react";
import { Link } from "react-router-dom";
import { PageHeader, ListGroup, ListGroupItem, Button, ButtonToolbar, ButtonGroup, } from "react-bootstrap";
import "./Home.css";

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }

    try {
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  lineFormatter = (transAcc, account) => {
    let line = "Balance: "
    if (transAcc) {
      let lineAcc = transAcc.find(x => x.accountId === account.accountId)
      if (lineAcc) {
        line += (parseInt(lineAcc.currentBal, 10) / 100).toFixed(2)
        if (lineAcc.interest) {
          if (lineAcc.currentCrRate > 0)
            line += ', Credit Rate: ' + (lineAcc.currentCrRate).toFixed(2) + "%"
          if (lineAcc.currentDbRate > 0)
            line += ', Debit Rate: ' + (lineAcc.currentDbRate).toFixed(2) + "%"
        }
      }
    }
    return line
  }

  handleAccountClick = event => {
    event.preventDefault();
    this.props.history.push(event.currentTarget.getAttribute("href"));
  }

  handleSortClick = async (i,dir,event) => {
    event.preventDefault()
    this.props.moveAccounts(i, dir)
    this.props.history.push("/");
  }

  renderAccountsList(accounts, transAcc) {
    let acclist = [{}]
    if (accounts) acclist = acclist.concat(accounts)
    return acclist.map(
      (account, i) =>
        i !== 0
          ? <div className="row" key={account.accountId}>
              <div className="col-sm-11">
                <ListGroupItem
                  key={account.accountId}
                  href={`/accounts/${account.accountId}`}
                  onClick={this.handleAccountClick}
                  header={account.description.trim().split("\n")[0]}
                >
                  {this.lineFormatter(transAcc,account)}
                </ListGroupItem>
              </div>
              <div className="col-sm-1">
              <ButtonToolbar id="buttons">
              <ButtonGroup vertical block>
                <Button onClick={(e) => this.handleSortClick(i,"U",e)} disabled={i===1}>&#x2B06;</Button>
                <Button onClick={(e) => this.handleSortClick(i,"D",e)} disabled={i===acclist.length-1}>&#x2B07;</Button>
              </ButtonGroup>
            </ButtonToolbar>
              </div>
            </div>
          : <div className="row" key="new">
          <div className="col-sm-11"><ListGroupItem
              key="new"
              href="/accounts/new"
              onClick={this.handleAccountClick}
            >
              <h4>
                <b>{"\uFF0B"}</b> Create a new account
              </h4>
            </ListGroupItem></div></div>
    );
  }

  renderLander() {
    return (
      <div className="lander">
        <h1>Lydia</h1>
        <p>Take control of your money</p>
        <div>
          <Link to="/login" className="btn btn-info btn-lg">
            Login
          </Link>
          <Link to="/signup" className="btn btn-success btn-lg">
            Signup
          </Link>
        </div>
      </div>
    );
  }

  renderAccounts() {
    return (
      <div className="accounts">
        <PageHeader>Your Accounts</PageHeader>
        <ListGroup>
          {!this.state.isLoading && this.renderAccountsList(this.props.accounts, this.props.transAcc)}
        </ListGroup>
      </div>
    );
  }

  render() {
    return (
      <div className="Home">
        {this.props.isAuthenticated ? this.renderAccounts() : this.renderLander()}
      </div>
    );
  }
}
