import React, { Component } from "react";
import {
  PageHeader,
  Button,
  ButtonToolbar,
  ButtonGroup
} from "react-bootstrap";
import { Navbar, NavItem, Nav, Tabs, Tab } from "react-bootstrap";
import "./Transactions.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import Moment from "moment";
import { calculate, deleteFutureAllTransactions } from "../libs/calculate";
import { Storage } from "aws-amplify";
import ReactTable from "react-table";
import "react-table/react-table.css";

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
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
      else {
        let data = [];
        // Maybe redundant. Should make sure data is present before allowing a Save
        let currAcc = transAcc.find(
          x => x.accountId === this.props.currentAccId
        );
        if (currAcc)
          data = [
            {
              transactionId: 0,
              date: currAcc.openingDate,
              description: "Opening Balance",
              balance: currAcc.amount
            },
            ...currAcc.trans
          ];
        this.setState({ data });
      }
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

  amountFormat = row => {
    let val = parseInt(row.value, 10) / 100;
    if (val) {
      let st;
      if (val < 0) st = { color: "red", textAlign: "right" };
      else st = { textAlign: "right" };
      return <div style={st}>{val.toFixed(2)}</div>;
    }
  };

  balanceFormat = row => {
    let val = parseInt(row.value, 10) / 100;
    let st;
    if (val < 0) st = { color: "red", textAlign: "right" };
    else st = { textAlign: "right" };
    return <div style={st}>{val.toFixed(2)}</div>;
  };

  dateFormat = row => {
    if (row != null) return <div>{Moment(row.value).format("Do MMM YY")}</div>;
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
        let data = [];
        let currentAccId = 0;
        // Maybe redundant. Should make sure data is present before allowing a Save
        if (transAcc.length > 0) {
          let currAcc = transAcc[0];
          currentAccId = currAcc.accountId;
          data = [
            {
              transactionId: 0,
              date: currAcc.openingDate,
              description: "Opening Balance",
              balance: currAcc.amount
            },
            ...currAcc.trans
          ];
        }
        this.setState({ data });

        this.props.setTransactions(transAcc);
        this.props.setCurrentAccId(currentAccId);
      })
      .catch(err => {
        if (err.statusCode === 403) {
          transAcc = calculate(
            this.props.accounts,
            this.props.templates,
            transAcc
          );
          this.props.setTransactions(transAcc);
          let data = [];
          let currentAccId = 0;
          let currAcc;
          if (transAcc) {
            currAcc = transAcc[0];
            currentAccId = currAcc.accountId;
          }
          if (currAcc)
            data = [
              {
                transactionId: 0,
                date: currAcc.openingDate,
                description: "Opening Balance",
                balance: currAcc.amount
              },
              ...currAcc.trans
            ];
          this.props.setCurrentAccId(currentAccId);
          this.setState({ data });
        } else console.log(err);
      });
  };

  handleTabSelect = eventKey => {
    this.props.setCurrentAccId(eventKey);
    let data = [];
    let currAcc;
    if (this.props.transAcc)
      currAcc = this.props.transAcc.find(x => x.accountId === eventKey);
    if (currAcc)
      data = [
        {
          transactionId: 0,
          date: currAcc.openingDate,
          description: "Opening Balance",
          balance: currAcc.amount
        },
        ...currAcc.trans
      ];
    this.setState({ data });
  };

  render() {
    let data = this.state.data;
    //  if (!data) data =[];

    // let currAcc;
    // if (this.props.transAcc)
    //   currAcc = this.props.transAcc.find(
    //     x => x.accountId === this.props.currentAccId
    //   );

    // let data = !currAcc
    //   ? []
    //   : [
    //       {
    //         transactionId: 0,
    //         date: currAcc.openingDate,
    //         description: "Opening Balance",
    //         balance: currAcc.amount
    //       },
    //       ...currAcc.trans
    //     ];

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
        <Tabs
          defaultActiveKey={1}
          animation={false}
          activeKey={this.props.currentAccId}
          onSelect={this.handleTabSelect}
          id="trans-tab"
        >
          {this.props.accounts.map((x, index) => (
            <Tab key={x.accountId} eventKey={x.accountId} title={x.accName}>
              {/* <BootstrapTable
                keyField="transactionId"
                maxHeight="120px"
                data={data}
                columns={this.columns()}
                rowEvents={this.rowEvents}
              /> */}
              <ReactTable
                data={data}
                columns={[
                  {
                    columns: [
                      {
                        Header: "Date",
                        accessor: "date",
                        Cell: this.dateFormat
                      },
                      {
                        Header: "Description",
                        accessor: "description",
                        width: 400
                      },
                      {
                        Header: "Credit",
                        accessor: "crAmount",
                        Cell: this.amountFormat
                      },
                      {
                        Header: "Debit",
                        accessor: "dbAmount",
                        Cell: this.amountFormat
                      },
                      {
                        Header: "Balance",
                        accessor: "balance",
                        Cell: this.balanceFormat
                      }
                    ]
                  }
                ]}
                defaultPageSize={100}
                style={{
                  height: "500px" // This will force the table body to overflow and scroll, since there is not enough room
                }}
                className="-striped -highlight"
              />
            </Tab>
          ))}
        </Tabs>
      </div>
    );
  }
}
