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
import { Storage } from "aws-amplify";

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
      let transAcc = this.props.transAcc;
      if (!transAcc) {
        console.log("Trans not here...have to make them")
        transAcc = await this.getTransactions();
        this.props.setTransactions(transAcc)
      } else { 
        console.log("Trans already exist!")
      }
      console.log('trans=',transAcc)

      accs.forEach((acc) => {
        let accInTrans = transAcc.find(x => x.accountId === acc.accountId);
        if (!accInTrans) {
          accInTrans = {accountId: acc.accountId, trans:[]};
          transAcc.push(accInTrans);
        }
        accInTrans.accName = acc.accName;
        accInTrans.description = acc.description;
        accInTrans.openingDate = acc.openingDate;
        accInTrans.closingDate = acc.closingDate;
        accInTrans.openingBal = acc.amount;
        accInTrans.openingCrRate = acc.crRate;
        accInTrans.openingDbRate = acc.dbRate;
        accInTrans.calcInterest = acc.interest;
        accInTrans.intPeriodType = acc.periodType;
        accInTrans.intPeriodCnt = acc.periodCnt;
        accInTrans.intFirstAppliedDate = acc.intFirstAppliedDate;
      });

      this.setState({
        templates,
        accs,
        transactions: transAcc,
        currentAcc: accs[0].accountId
      });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  getTransactions = () => {
//    return testTransactions;
return [];
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

  recalculate = () => {
    this.setState({
      transactions: Calculate(this.state.transactions, this.state.templates)
    });
  };

  handleAccountSelection = eventKey => {
    this.setState({ currentAcc: eventKey });
  };

  handleSave = () => {
    let key = "hello.txt"
    Storage.put(key, JSON.stringify(this.state.transactions), {
      level: 'private',
      contentType: 'application/json'}).then (result => console.log(result)).catch(err => console.log(err));
    };

  handleLoad = () => {
    let key = "hello.txt"
    Storage.get(key, {level: 'private',download: true})
    .then(result => {
      console.log('Result=>',result)
      let res = new TextDecoder("utf-8").decode(result.Body);
      console.log('res=>',res)


      let transAcc = JSON.parse(res)
      console.log("transAcc=>",transAcc)
      this.setState({transactions:transAcc})
      })
    .catch(err => console.log(err));

  };

  render() {
    let currAcc = this.state.transactions.find(
      x => x.accountId === this.state.currentAcc
    );
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
                    {x.accName}
                  </NavItem>
                ))}
              </Nav>
            </Navbar>
          </div>
          <div className="col-sm-4">
            <ButtonToolbar className="pull-right">
              <ButtonGroup>
                <Button bsSize="large" onClick={this.handleLoad}>Load</Button>
                <Button bsSize="large" onClick={this.handleSave}>Save</Button>
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
          keyField="transactionId" maxHeight='120px'
          data={
            this.state.currentAcc === null
              ? []
              : [
                  {
                    transactionId: 0,
                    date: currAcc.openingDate,
                    description: "Opening Balance",
                    balance: currAcc.openingBal
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
