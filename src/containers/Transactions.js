import React, { Component } from "react";
import {
  PageHeader,
  Button,
  ButtonToolbar,
  ButtonGroup
} from "react-bootstrap";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";
import "./Transactions.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import { API } from "aws-amplify";
import Moment from "moment";
import {testTransactions} from "../TestData/TestTrans"

export default class Transactions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      templates: [],
      transactions: [],
      accs: [],
      data: [],
      currentAcc: null
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }
    try {
      const accs = await this.accounts();
      const t1 = await this.templates();
      const templates = t1.map(({ accountFromId: afid, ...rest }) => ({
        accountName: accs.find(x => x.accountId === afid).content,
        ...rest
      }));
      this.setState({
        templates,
        accs,
        transactions:testTransactions,
        currentAcc: accs[1].accountId,
        data: testTransactions.find(x => x.accountId === accs[1].accountId).trans
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
      text: "Date"
    },
    {
      dataField: "description",
      text: "Description"
    },
    {
      dataField: "crAmount",
      text: "Credit"
    },
    {
      dataField: "dbAmount",
      text: "Debit"
    },
    {
      dataField: "balance",
      text: "Balance"
    }
  ];

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
    alert("hello");
  };

  handleNavSelect = (eventKey) => {
    console.log(eventKey)
  }

  render() {
    return (
      <div className="transactions">
        <PageHeader>Transactions</PageHeader>

<Navbar>
<Navbar.Header>
            <Navbar.Toggle />
          </Navbar.Header>
  <Nav onSelect={this.handleNavSelect}>
    <NavItem eventKey={1}>
      Cheque
    </NavItem>
    <NavItem eventKey={2}>
      Savings
    </NavItem>
  </Nav>
</Navbar>

        <BootstrapTable
          keyField="transactionId"
          data={this.state.data}
          columns={this.columns()}
          rowEvents={this.rowEvents}
        />
        <ButtonToolbar className="pull-right">
          <ButtonGroup>
            <Button>Load</Button>
            <Button>Save</Button>
          </ButtonGroup>
          <Button bsStyle="success" onClick={this.recalculate}>
            Recalculate
          </Button>
        </ButtonToolbar>
       </div>
    );
  }
}
