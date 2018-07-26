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
import { calculate, deleteFutureAllTransactions } from "../libs/calculate";
import { Storage } from "aws-amplify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid/dist/styles/ag-grid.css";
import "ag-grid/dist/styles/ag-theme-bootstrap.css";
import { today } from "../libs/utilities";

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.gridApi = [];
    let descriptionWidth = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 1266,255)
    this.state = {
      isLoading: true,
      columnDefs: [
        {
          headerName: "",
          field: "reconciled",
          width: 22,
          cellStyle: {margin: "0px","padding":"0px",textAlign: "center","font-style":"normal" },
          valueFormatter: this.reconciledFormatter,
        },
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
          width: descriptionWidth
        },
        {
          headerName: "Credit",
          field: "crAmount",
          type: "numericColumn",
          width: 110,
          editable: this.rowEditable,
          cellEditor: "agTextCellEditor",
          cellEditorParams: { useFormatter: true },
          valueParser: this.amountParser,
          valueFormatter: this.amountFormatter
        },
        {
          headerName: "Debit",
          width: 110,
          field: "dbAmount",
          editable: this.rowEditable,
          type: "numericColumn",
          cellEditor: "agTextCellEditor",
          cellEditorParams: { useFormatter: true },
          valueParser: this.amountParser,
          valueFormatter: this.amountFormatter
        },
        {
          headerName: "Balance",
          field: "balance",
          width: 115,
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
    if (isNaN(params.newValue))
      this.gridApi[this.props.currentAccId].stopEditing(true);
  };

  amountParser = params => {
    let val = Number(params.newValue);
    if (isNaN(val)) return params.oldValue;
    else return Math.round(val * 100);
  };

  amountFormatter = params => {
    let val = parseInt(params.value, 10) / 100;
    if (val) return val.toFixed(2);
    return "";
  };

  reconciledFormatter = params => {
    let unicode = "0020"
    if (params.value === 1) unicode = "2713" 
    if (params.value === 2) unicode = "2705" 
    return String.fromCharCode(parseInt(unicode,16))
  }

  balanceFormatter = params => (parseInt(params.value, 10) / 100).toFixed(2)

  dateFormatter = params => Moment(params.value).format("Do MMM YY")

  getRowStyle = params => {
    let rowStyle = {}
    if (Moment(params.node.data.date).startOf("date").isSameOrBefore(today, "day")) rowStyle = { "background-color" : "#D3D3D3"}
    if (params.node.rowIndex === 0) rowStyle["font-weight"] = "bold"
    if (!params.node.data.autogen) rowStyle["font-style"] = "italic"
    return rowStyle
  }

  rowEditable = node => node.data.transactionId !== 0 && ((Moment(node.data.date).isSameOrBefore(today, "day")) || (!node.data.autogen))
 
  onCellClicked = (node) => {
    if (node.column.colId === "reconciled" && node.rowIndex > 0)
      if (Moment(node.data.date).isSameOrBefore(today, "day")){
        let transAcc = this.props.transAcc;
        let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
        let data = node.data;
        let trans = acc.trans.find(x => x.transactionId === data.transactionId);
        if (isNaN(trans.reconciled) || trans.reconciled === null ) trans.reconciled = 0
        trans.reconciled++;
        if (trans.reconciled ===3) trans.reconciled = 0
        node.data.reconciled = trans.reconciled
        this.props.setTransactions(transAcc);
        this.props.setSaveRequired(true);
        let params = { rowNodes: [node] };
        this.gridApi[this.props.currentAccId].refreshCells(params);
      }
  }

  handleRecalculate = () => {
    let transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      this.props.transAcc,
      today
    );
    this.props.setTransactions(transAcc);
    this.props.setSaveRequired(true);
    this.props.setRecalcRequired(false);
  };

  handleSave = () => {
    // let key = "data.txt";
    // let dataToSave = this.props.transAcc;
    // let strToSave = JSON.stringify(dataToSave)
    // let transAcc = this.props.transAcc
    let transAcc = deleteFutureAllTransactions(this.props.accounts, this.props.transAcc,today)
    let key = "data2.txt";
    let dataToSave = [this.props.accounts,this.props.templates,transAcc,today.format()]
    let strToSave = JSON.stringify(dataToSave)
    Storage.put(key, strToSave, {
      level: "private",
      contentType: "application/json"
    })
      .then(result => {this.props.setSaveRequired(false);
      alert("Transactions saved successfully")})
      .catch(err => alert(err));
  };

  handleLoad = () => {
    // let key = "data.txt";
    let key = "data2.txt";
    let transAcc = [];

    Storage.get(key, { level: "private", download: true })
      .then(result => {
        let res = new TextDecoder("utf-8").decode(result.Body);
        let dataToRestore = JSON.parse(res)
        transAcc = calculate(...dataToRestore)
        // transAcc = calculate(
        //   this.props.accounts,
        //   this.props.templates,
        //   JSON.parse(res),
        //   today
        // );
        let currentAccId = 0;
        if (transAcc.length > 0) currentAccId = transAcc[0].accountId;
        this.props.setTransactions(transAcc);
        this.props.setCurrentAccId(currentAccId);
        this.props.setSaveRequired(false);
        this.props.setRecalcRequired(false);
      })
      .catch(err => {
        if (err.statusCode === 403) {
          transAcc = calculate(
            this.props.accounts,
            this.props.templates,
            transAcc,
            today
          );
          let currentAccId = 0;
          if (transAcc.length > 0) currentAccId = transAcc[0].accountId;
          this.props.setCurrentAccId(currentAccId);
          this.props.setTransactions(transAcc);
          this.props.setSaveRequired(false);
          this.props.setRecalcRequired(false);
        } else console.log(err);
      });
  };

  handleTabSelect = eventKey => {
    this.props.setCurrentAccId(eventKey);
  };

  handleDelete = () => {
    let nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    if (nodes.length) {
      let transAcc = this.props.transAcc;
      let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
      let data = nodes[0].data;
      acc.trans = acc.trans.filter(x => x.transactionId !== data.transactionId);
      nodes[0].setData(data);
      this.props.setTransactions(transAcc);
      this.props.setRecalcRequired(true);
      this.props.setSaveRequired(true);
      let params = { rowNodes: nodes };
      this.gridApi[this.props.currentAccId].refreshCells(params);
    }
  };

  handleManual = () => {
    let nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    if (nodes.length) {
      let transAcc = this.props.transAcc;
      let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
      let data = nodes[0].data;
      let transToUpdate = acc.trans.find(
        x => x.transactionId === data.transactionId
      );
      data.autogen = null;
      transToUpdate.autogen = null;
      transToUpdate.type = "manual"
      nodes[0].setData(data);
      this.props.setTransactions(transAcc);
      this.props.setRecalcRequired(true);
      this.props.setSaveRequired(true);
      let params = { rowNodes: nodes };
      this.gridApi[this.props.currentAccId].refreshCells(params);
    }
  };

  updateRow = node => {
    let transAcc = this.props.transAcc
    let acc = transAcc.find(x => x.accountId === this.props.currentAccId)
    let data = node.data
    if (Moment(data.date).isAfter(today)) data.reconciled = 0
    let transToUpdate = acc.trans.find(
      x => x.transactionId === data.transactionId
    )
    transToUpdate.description = data.description
    transToUpdate.date = data.date
    transToUpdate.reconciled = data.reconciled
    transToUpdate.crAmount = data.crAmount
    transToUpdate.dbAmount = data.dbAmount
    this.props.setTransactions(transAcc)
    this.props.setRecalcRequired(true)
    this.props.setSaveRequired(true)
    this.gridApi[this.props.currentAccId].redrawRows()
  }

  render() {
    let h =
      Math.max(document.documentElement.clientHeight, window.innerHeight || 0) -
      280;
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
                  rowSelection="single"
                  onCellEditingStopped={this.updateRow}
                  onCellClicked={this.onCellClicked}
                  rowDeselection={true}
                  deltaRowDataMode={true}
                  enableColResize={true}
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
          <div className="col-sm-12">
            <ButtonToolbar id="buttons" className="pull-right">
              <ButtonGroup>
                <Button onClick={this.handleDelete}>Delete</Button>
                <Button onClick={this.handleManual}>Manual</Button>
                <Button onClick={this.handleLoad}>Load</Button>
                <Button
                  bsStyle={this.props.saveRequired ? "warning" : "default"}
                  onClick={this.handleSave}
                >
                  Save
                </Button>
              </ButtonGroup>
              <Button
                bsStyle={this.props.recalcRequired ? "warning" : "success"}
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
