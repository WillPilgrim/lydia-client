import React, { Component } from "react";
import {
  PageHeader,
  Button,
  ButtonToolbar,
  ButtonGroup
} from "react-bootstrap";
import { Navbar, NavItem, Nav } from "react-bootstrap";
import "./Transactions.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import { API } from "aws-amplify";
import Moment from "moment";
import { testTransactions } from "../TestData/TestTrans";
import Calculate from "../libs/calculate";

export default class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      templates: [],
      transactions: [],
      accs: [],
      currentAcc: null
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }
    try {
      const accs = await this.accounts();
      const templates = await this.templates();
      this.setState({
        templates,
        accs,
        transactions: testTransactions,
        currentAcc: accs[1].accountId
      });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  accounts() {
    return API.get("accounts", "/accounts");
  }

  templates() {
    return API.get("accounts", "/templates");
  }

  dateFormatter = (cell, row) => {
    if (cell != null) return Moment(cell).format("Do MMM YY");
  };

  columns = () => [
    {
      dataField: "date",
      text: "Date",
      formatter: this.dateFormatter
    },
    {
      dataField: "description",
      text: "Description",
      headerStyle: (c,i) => { return { width: '50%', textAlign: 'center'};}
    },
    {
      dataField: "crAmount",
      text: "Credit",
      align: "right",
      formatter: this.amountFormatter
    },
    {
      dataField: "dbAmount",
      text: "Debit",
      align: "right",
      formatter: this.amountFormatter
    },
    {
      dataField: "balance",
      text: "Balance",
      formatter: this.amountFormatter,
      style: this.amountStyle
    }
  ];

  amountFormatter = (cell, row) => {
    let val = parseInt(cell,10) / 100;
    if (val) return val.toFixed(2);
  };

  amountStyle = (cell, row) => {
    let val = parseInt(cell,10) / 100;
    if (val < 0) return { color: "red", textAlign: "right" };
    else return { textAlign: "right" };
  };

  rowEvents = {
    onClick: (e, row, rowIndex) => {
      e.preventDefault();
      this.props.history.push(`/transactions/${row.templateId}`);
    }
  };

  handleNewTemplateClick = event => {
    event.preventDefault();
    this.props.history.push(event.currentTarget.getAttribute("href"));
  };

  recalculate = () => {
    this.setState({
      transactions: Calculate(this.state.transactions, this.state.templates)
    });
  };

  handleAccountSelection = eventKey => {
    this.setState({ currentAcc: eventKey });
  };

  render() {
    return (
      <div className="transactions">
        <PageHeader>Transactions</PageHeader>

        <div className="row">
          <div className="col-sm-8">
            <Navbar onSelect={this.handleAccountSelection}>
              <Nav>
                {this.state.accs.map((x, index) => (
                  <NavItem
                    key={x.accountId}
                    eventKey={x.accountId}
                    active={x.accountId === this.state.currentAcc}
                  >
                    {x.content}
                  </NavItem>
                ))}
              </Nav>
            </Navbar>
          </div>
          <div className="col-sm-4">
            <ButtonToolbar className="pull-right">
              <ButtonGroup>
                <Button bsSize="large">Load</Button>
                <Button bsSize="large">Save</Button>
              </ButtonGroup>
              <Button
                bsStyle="success"
                bsSize="large"
                onClick={this.recalculate}
              >
                Recalculate
              </Button>
            </ButtonToolbar>
          </div>
        </div>

        <BootstrapTable
          keyField="transactionId"
          data={
            this.state.currentAcc === null
              ? []
              : this.state.transactions.find(
                  x => x.accountId === this.state.currentAcc
                ).trans
          }
          columns={this.columns()}
          rowEvents={this.rowEvents}
        />
      </div>
    );
  }
}
