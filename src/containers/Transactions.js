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
import Moment from "moment";
import { calculate, deleteFutureAllTransactions } from "../libs/calculate";
import { Storage } from "aws-amplify";

export default class Transactions extends Component {
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
      let transAcc = this.props.transAcc;
      if (!transAcc) this.handleLoad();
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
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
      headerStyle: (c, i) => {
        return { width: "50%", textAlign: "center" };
      },
      style: (c, r, i) => {
        if (i === 0) return { color: "blue" };
      }
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
      formatter: this.balanceFormatter,
      style: this.amountStyle
    }
  ];

  amountFormatter = cell => {
    let val = parseInt(cell, 10) / 100;
    if (val) return val.toFixed(2);
  };

  balanceFormatter = cell => {
    let val = parseInt(cell, 10) / 100;
    return val.toFixed(2);
  };
  amountStyle = (cell, row) => {
    let val = parseInt(cell, 10) / 100;
    if (val < 0) return { color: "red", textAlign: "right" };
    else return { textAlign: "right" };
  };

  rowEvents = {
    onClick: (e, row, rowIndex) => {
      e.preventDefault();
      this.props.history.push(`/transactions/${row.templateId}`);
    }
  };

  handleRecalculate = () => {
    this.props.setTransactions(
      calculate(this.props.accounts, this.props.templates, this.props.transAcc)
    );
  };

  handleAccountSelection = eventKey => {
    this.props.setCurrentAccId(eventKey);
  };

  handleSave = () => {
    //    console.log('Transactions:handleSave:About to delfuture',this.props.transAcc)
    let dataToSave = deleteFutureAllTransactions(
      this.props.accounts,
      this.props.transAcc
    );
    let key = "data.txt";
    Storage.put(key, JSON.stringify(dataToSave), {
      level: "private",
      contentType: "application/json"
    })
      .then(alert("Transactions saved successfully"))
      .catch(err => alert(err));
  };

  handleLoad = () => {
    let key = "data.txt";
    let transAcc = [];
    // if (this.state.isLoading) {
    //   transAcc = calculate(
    //     this.props.accounts,
    //     this.props.templates,
    //     transAcc
    //   );
    //   this.props.setTransactions(transAcc);
    //   return;
    // }
    Storage.get(key, { level: "private", download: true })
      .then(result => {
        let res = new TextDecoder("utf-8").decode(result.Body);
//        console.log("Transactions:handleLoad:Before calculate", res);
        transAcc = calculate(
          this.props.accounts,
          this.props.templates,
          JSON.parse(res)
        );
        this.props.setTransactions(transAcc);
      })
      .catch(err => {
        if (err.statusCode === 403) {
          transAcc = calculate(
            this.props.accounts,
            this.props.templates,
            transAcc
          );
          this.props.setTransactions(transAcc);
        } else console.log(err);
      });
  };

  render() {
    let currAcc;
    if (this.props.transAcc)
      currAcc = this.props.transAcc.find(
        x => x.accountId === this.props.currentAccId
      );
    return (
      <div className="transactions">
        <PageHeader>Transactions</PageHeader>

        <div className="row">
          <div className="col-sm-8">
            <Navbar onSelect={this.handleAccountSelection}>
              <Nav>
                {this.props.accounts.map((x, index) => (
                  <NavItem
                    key={x.accountId}
                    eventKey={x.accountId}
                    active={x.accountId === this.props.currentAccId}
                  >
                    {x.accName}
                  </NavItem>
                ))}
              </Nav>
            </Navbar>
          </div>
          <div className="col-sm-4">
            <ButtonToolbar className="pull-right">
              <ButtonGroup>
                <Button bsSize="large" onClick={this.handleLoad}>
                  Load
                </Button>
                <Button bsSize="large" onClick={this.handleSave}>
                  Save
                </Button>
              </ButtonGroup>
              <Button
                bsStyle="success"
                bsSize="large"
                onClick={this.handleRecalculate}
              >
                Recalculate
              </Button>
            </ButtonToolbar>
          </div>
        </div>

        <BootstrapTable
          keyField="transactionId"
          maxHeight="120px"
          data={
            !currAcc
              ? []
              : [
                  {
                    transactionId: 0,
                    date: currAcc.openingDate,
                    description: "Opening Balance",
                    balance: currAcc.amount
                  },
                  ...currAcc.trans
                ]
          }
          columns={this.columns()}
          rowEvents={this.rowEvents}
        />
      </div>
    );
  }
}
