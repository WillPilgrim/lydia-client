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
import { uuid } from "../libs/utilities";

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.gridApi = [];
    this.state = {
//      components: { datePicker: getDatePicker() },
      isLoading: true,
      columnDefs: [
        {
          headerName: "Date",
          field: "date",
          filter: "agDateColumnFilter",
          width: 110,
          valueFormatter: this.dateFormatter,
          cellStyle: { textAlign: "right" },
          editable: this.rowEditable
        },
        {
          headerName: "Description",
          field: "description",
          editable: this.rowEditable,
          width: 400
        },
        {
          headerName: "Credit",
          field: "crAmount",
          type: "numericColumn",
          editable: this.rowEditable,
          cellEditor: 'agTextCellEditor',
          cellEditorParams: { useFormatter: true},
          valueParser: this.amountParser,
          valueFormatter: this.amountFormatter
        },
        {
          headerName: "Debit",
          field: "dbAmount",
          editable: this.rowEditable,
          type: "numericColumn",
          cellEditor: 'agTextCellEditor',
          cellEditorParams: { useFormatter: true},
          valueParser: this.amountParser,
          valueFormatter: this.amountFormatter
        },
        {
          headerName: "Balance",
          field: "balance",
          type: "numericColumn",
          valueFormatter: this.balanceFormatter,
          cellStyle: params => {
            if (params.value < 0) {
              return { color: "red" };
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
      if (!transAcc) this.handleLoad();
    } catch (e) {
      alert(e);
    }
    this.setState({ isLoading: false });
  }

  onAmountChanged = params => {
    console.log('Before==>',params)
    if (isNaN(params.newValue)) this.gridApi[this.props.currentAccId].stopEditing(true);
    console.log('After==>',params)
  }

   amountParser = params => {
     let val = Number(params.newValue);
     if (isNaN(val)) return params.oldValue
     else return Math.floor(val * 100)
   }

  amountFormatter = params => {
    let val = parseInt(params.value, 10) / 100;
    if (val) return val.toFixed(2);
    return "";
  };

  balanceFormatter = params => (parseInt(params.value, 10) / 100).toFixed(2);

  dateFormatter = params => Moment(params.value).format("Do MMM YY");

  getRowStyle = params => {
    if (params.node.rowIndex === 0) {
      return { "font-weight": "bold" };
    }
    if (!params.node.data.autogen) return { "font-style": "italic" };
  };

  rowEditable = node => node.data.transactionId !== 0

  handleRecalculate = () => {
    let transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      this.props.transAcc
    );
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
        let currentAccId = 0;
        if (transAcc.length > 0) currentAccId = transAcc[0].accountId;
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
          let currentAccId = 0;
          if (transAcc.length > 0) currentAccId = transAcc[0].accountId;
          this.props.setCurrentAccId(currentAccId);
          this.props.setTransactions(transAcc);
        } else console.log(err);
      });
  };

  handleTabSelect = eventKey => {
    this.props.setCurrentAccId(eventKey);
  };

  handleDelete = () => {
    let nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    let transAcc = this.props.transAcc;
    let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
    let data = nodes[0].data;
    acc.trans = acc.trans.filter(x => x.transactionId !== data.transactionId);
    nodes[0].setData(data);
    this.props.setTransactions(transAcc);
    let params = { rowNodes: nodes };
    this.gridApi[this.props.currentAccId].refreshCells(params);
  };

  handleManual = () => {
    let nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    let transAcc = this.props.transAcc;
    let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
    let data = nodes[0].data;
    let transToUpdate = acc.trans.find(
      x => x.transactionId === data.transactionId
    );
    data.autogen = null;
    transToUpdate.autogen = null;
    nodes[0].setData(data);
    this.props.setTransactions(transAcc);
    let params = { rowNodes: nodes };
    this.gridApi[this.props.currentAccId].refreshCells(params);
  };

  updateRow = node => {
    let transAcc = this.props.transAcc;
    let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
    let data = node.data;
    let transToUpdate = acc.trans.find(
      x => x.transactionId === data.transactionId
    );
    transToUpdate.description = data.description;
    transToUpdate.date = data.date;
    transToUpdate.crAmount = data.crAmount;
    transToUpdate.dbAmount = data.dbAmount;
    this.props.setTransactions(transAcc);
  };

  render() {
    let h =
      Math.max(document.documentElement.clientHeight, window.innerHeight || 0) -
      284;
    let divStyle = { boxSizing: "border-box", height: `${h}px` };
    let data = [];
    let currAcc;
    if (this.props.transAcc)
      currAcc = this.props.transAcc.find(
        x => x.accountId === this.props.currentAccId
      );
    if (currAcc) {
      data = [
        {
          transactionId: 0,
          date: currAcc.openingDate,
          description: "Opening Balance",
          balance: currAcc.amount
        }
      ];
      currAcc.trans.forEach(x => {
        let newitem = { ...x };
        data.push(newitem);
      });
    }
    if (this.gridApi[this.props.currentAccId])
      this.gridApi[this.props.currentAccId].setRowData(data);
    // data = [
    //   {
    //     transactionId: 0,
    //     date: currAcc.openingDate,
    //     description: "Opening Balance",
    //     balance: currAcc.amount
    //   },
    //  ...currAcc.trans
    // ];
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
                style={divStyle}
                className="ag-theme-bootstrap"
              >
                <AgGridReact
                  headerHeight={30}
                  columnDefs={this.state.columnDefs}
                  //               rowData={data}
                  //               editType="fullRow"
                  rowSelection="single"
                  onCellEditingStopped={this.updateRow}
                  rowDeselection={true}
                  deltaRowDataMode={true}
                  components={this.state.components}
                  getRowNodeId={data => data.transactionId}
                  getRowStyle={this.getRowStyle}
                  isRowSelectable={node => node.data.transactionId !== 0}
                  onGridReady={params => {
                    this.gridApi[x.accountId] = params.api;

                    let data = [];
                    let currAcc;
                    if (this.props.transAcc)
                      currAcc = this.props.transAcc.find(
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

                    params.api.setRowData(data);
                  }}
                />
              </div>
            </Tab>
          ))}
        </Tabs>
        <div className="row">
          <div className="col-sm-6" />
          <div className="col-sm-6">
            <ButtonToolbar id="buttons" className="pull-right">
              <ButtonGroup>
                <Button onClick={this.handleDelete}>Delete</Button>
                <Button onClick={this.handleManual}>Manual</Button>
                <Button onClick={this.handleLoad}>Load</Button>
                <Button onClick={this.handleSave}>Save</Button>
              </ButtonGroup>
              <Button bsStyle="success" onClick={this.handleRecalculate}>
                Recalculate
              </Button>
            </ButtonToolbar>
          </div>
        </div>
      </div>
    );
  }
}
