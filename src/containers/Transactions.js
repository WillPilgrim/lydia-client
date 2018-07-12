import React, { Component } from "react";
import {
  PageHeader,
  Button,
  ButtonToolbar,
  ButtonGroup,
  Tabs,
  Tab
} from "react-bootstrap";
import "./Transactions.css";
import Moment from "moment";
import { calculate } from "../libs/calculate";
import { Storage } from "aws-amplify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid/dist/styles/ag-grid.css";
import "ag-grid/dist/styles/ag-theme-bootstrap.css";

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      isLoading: true,
      columnDefs: [
        {
          headerName: "Date",
          field: "date",
          filter: "agDateColumnFilter",
          width: 110,
          valueFormatter: this.dateFormatter,
          cellStyle: {textAlign: "right"}
        },
        {
          headerName: "Description",
          field: "description",
          width: 400
        },
        {
          headerName: "Credit",
          field: "crAmount",
          type: "numericColumn",
          valueFormatter : this.amountFormatter
        },
        {
          headerName: "Debit",
          field: "dbAmount",
          type: "numericColumn",
          valueFormatter : this.amountFormatter
        },
        {
          headerName: "Balance",
          field: "balance",
          type: "numericColumn",
          valueFormatter : this.balanceFormatter,
          cellStyle: (params) => {
            if (params.value < 0) {
                return {color: 'red'};
            } else {
                return null;
            }
          }
        }
      ]
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }
    try {
      let transAcc = this.props.transAcc;
      if (!transAcc) {
        this.handleLoad();
      } else {
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
    this.setState({ isLoading: false});
  }

  amountFormatter = params => { 
    let val = parseInt(params.value, 10) / 100;
    if (val) return val.toFixed(2);
    return "";
  }

  balanceFormatter = params => (parseInt(params.value, 10) / 100).toFixed(2);
  
  dateFormatter = params => Moment(params.value).format("Do MMM YY");

  getRowStyle = (params) => {
    if (params.node.rowIndex === 0) {
      return { 'font-weight': 'bold'}
    }
  };

  handleRecalculate = () => {
    let transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      this.props.transAcc
    );
    let data = [];

    if (transAcc.length > 0) {
      let currAcc = transAcc[0];
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
  };

  handleSave = () => {
    let dataToSave = this.props.transAcc;
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
    Storage.get(key, { level: "private", download: true })
      .then(result => {
        let res = new TextDecoder("utf-8").decode(result.Body);
        transAcc = calculate(
          this.props.accounts,
          this.props.templates,
          JSON.parse(res)
        );
        let data = [];
        let currentAccId = 0;
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
    return (
      <div className="transactions">
        <PageHeader>Transactions</PageHeader>

        <Tabs
          defaultActiveKey={1}
          animation={false}
          activeKey={this.props.currentAccId}
          onSelect={this.handleTabSelect}
          id="trans-tab"
        >
          {this.props.accounts.map((x, index) => (
            <Tab key={x.accountId} eventKey={x.accountId} title={x.accName}>
              <div
                id="transGrid"
                style={{
                  boxSizing: "border-box",
                  height: "500px"
                }}
                className="ag-theme-bootstrap"
                >
                <AgGridReact
                  columnDefs={this.state.columnDefs}
                  rowData={this.state.data}
                  getRowStyle={this.getRowStyle}
                />
              </div>
            </Tab>
          ))}
        </Tabs>
        <div className="row">
          <div className="col-sm-8">
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
      </div>
    );
  }
}