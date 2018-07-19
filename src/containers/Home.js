import React, { Component } from "react";
import { Link } from "react-router-dom";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
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

  handleAccountClick = event => {
    event.preventDefault();
    this.props.history.push(event.currentTarget.getAttribute("href"));
  }

  balanceFormatter = value => (parseInt(value, 10) / 100).toFixed(2)

  renderAccountsList(accounts, transAcc) {
    let acclist = [{}]
    if (accounts) acclist = acclist.concat(accounts)
    return acclist.map(
      (account, i) =>
        i !== 0
          ? <ListGroupItem
              key={account.accountId}
              href={`/accounts/${account.accountId}`}
              onClick={this.handleAccountClick}
              header={account.description.trim().split("\n")[0]}
            >
              {"Balance: " + (transAcc ? this.balanceFormatter(transAcc.find(x => x.accountId === account.accountId).currentBal) : "")}
            </ListGroupItem>
          : <ListGroupItem
              key="new"
              href="/accounts/new"
              onClick={this.handleAccountClick}
            >
              <h4>
                <b>{"\uFF0B"}</b> Create a new account
              </h4>
            </ListGroupItem>
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
