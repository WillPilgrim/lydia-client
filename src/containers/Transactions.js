import React, { Component } from "react";
import {
  PageHeader,
  Button,
  ButtonToolbar,
  ButtonGroup,
  Tabs,
  Tab,
  Modal,
  InputGroup,
  FormControl,
  FormGroup,
  Checkbox,
  ControlLabel
} from "react-bootstrap";
import "./Transactions.css";
import Moment from "moment";
import { calculate, deleteFutureAllTransactions } from "../libs/calculate";
import { Storage } from "aws-amplify";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css";
import { today, uuid } from "../libs/utilities";
import DatePicker from "react-16-bootstrap-date-picker";


export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.gridApi = [];
    let descriptionWidth = Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 1266,234)
    this.state = {
      intFirstAppliedDate: today.format(),
      newRateCredit: false,
      newRateValue: 0,
      showInterest: false,
      isLoading: true,
      defaultColDef : 
      {
        resizable : true
      },
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
          filterParams: {
            comparator: function(filterLocalDateAtMidnight, cellValue) {
              let dateParts = cellValue.split("-");
              let day = Number(dateParts[2]);
              let month = Number(dateParts[1]) - 1;
              let year = Number(dateParts[0]);
              let cellDate = new Date(year, month, day);
              if (cellDate < filterLocalDateAtMidnight) {
                return -1;
              } else if (cellDate > filterLocalDateAtMidnight) {
                return 1;
              } else {
                return 0;
              }
            }
          },
          width: 110,
          valueFormatter: this.dateFormatter,
          cellStyle: { textAlign: "right" },
          editable: this.rowEditable,
          cellEditor: "agTextCellEditor"
        },
        {
          headerName: "Description",
          field: "description",
          editable: this.rowEditable,
          width: descriptionWidth,
          filter: "agTextColumnFilter",
          cellEditor: "agTextCellEditor"
        },
        {
          headerName: "Credit",
          field: "crAmount",
          type: "numericColumn",
          width: 110,
          editable: this.rowEditable,
          valueParser: this.amountParser,
          valueFormatter: this.amountFormatter,
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions,
          cellEditorParams: { useFormatter: true },
          cellEditor: "agTextCellEditor"
        },
        {
          headerName: "Debit",
          width: 110,
          field: "dbAmount",
          editable: this.rowEditable,
          type: "numericColumn",
          valueParser: this.amountParser,
          valueFormatter: this.amountFormatter,
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions,
          cellEditorParams: { useFormatter: true },
          cellEditor: "agTextCellEditor"

        },
        {
          headerName: "Balance",
          field: "balance",
          width: 115,
          type: "numericColumn",
          valueFormatter: this.balanceFormatter,
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions,
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

  amountFilterOptions = { 
    filterOptions: [
      {
        displayKey: 'equals',
        displayName: 'Equals',
        test: function(filterValue, cellValue) {
          let temp = parseInt(cellValue, 10) / 100;
            return temp === filterValue;
        }
      },
      {
        displayKey: 'lessthan',
        displayName: 'Less than',
        test: function(filterValue, cellValue) {
          let temp = parseInt(cellValue, 10) / 100;
            return temp < filterValue;
        }
      },
      {
        displayKey: 'greaterthan',
        displayName: 'Greater than',
        test: function(filterValue, cellValue) {
          let temp = parseInt(cellValue, 10) / 100;
            return temp > filterValue;
        }
      }
    ]
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
    )
    this.props.setTransactions(transAcc)
    this.props.setSaveRequired(true)
    this.props.setRecalcRequired(false)
  }

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
  }

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
        transAcc = calculate(
          this.props.accounts,
          this.props.templates,
          transAcc,
          today
        )
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
  }

  handleTabSelect = eventKey => {
    this.props.setCurrentAccId(eventKey)
  }

  handleDelete = () => {
    let nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    if (nodes.length) {
      let transAcc = this.props.transAcc;
      let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
      let data = nodes[0].data;
      acc.trans = acc.trans.filter(x => x.transactionId !== data.transactionId);
      nodes[0].setData(data);

      transAcc = calculate(
        this.props.accounts,
        this.props.templates,
        transAcc,
        today
      )
      this.props.setTransactions(transAcc)
      this.props.setSaveRequired(true)
      this.props.setRecalcRequired(false)


      // this.props.setTransactions(transAcc);
      // this.props.setRecalcRequired(true);
      // this.props.setSaveRequired(true);
      // let params = { rowNodes: nodes };
      // this.gridApi[this.props.currentAccId].refreshCells(params);
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
      //if (transToUpdate.type === "manual" && (transToUpdate.description === "Interest Debit" || transToUpdate.description === "Interest Debit") ) transToUpdate.type = "interest"
      //else
       transToUpdate.type = "manual"
      nodes[0].setData(data);
      this.props.setTransactions(transAcc);
      this.props.setRecalcRequired(true);
      this.props.setSaveRequired(true);
      let params = { rowNodes: nodes };
      this.gridApi[this.props.currentAccId].refreshCells(params);
    }
  }

  handleDuplicate = () => {
    let nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    if (nodes.length) {
      let data = nodes[0].data
      let newNode = {
        date: data.date,
        autogen: null,
        type: "manual",
        transactionId: uuid(),
        dbAmount: data.dbAmount,
        crAmount: data.crAmount,
        description: data.description
      }
      let transAcc = this.props.transAcc
      let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
      acc.trans.push(newNode)
      transAcc = calculate(
        this.props.accounts,
        this.props.templates,
        transAcc,
        today
      )
      this.props.setTransactions(transAcc)
      this.props.setSaveRequired(true)
      this.props.setRecalcRequired(false)
      }
  }

  handleAdd = () => {
    let newNode = {
      date: today,
      autogen: null,
      type: "manual",
      transactionId: uuid(),
      dbAmount: 0,
      crAmount: 0,
      description: "New Item"
    }
    let transAcc = this.props.transAcc
    let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
    acc.trans.push(newNode)
    transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      transAcc,
      today
    )
    this.props.setTransactions(transAcc)
    this.props.setSaveRequired(true)
    this.props.setRecalcRequired(false)
  }

  handleInterestCommit = () => {
    let newRate = parseFloat(this.state.newRateValue).toFixed(2);
    let desc;
    if (this.state.newRateCredit) desc = " New credit rate: " + newRate + "%"
    else desc = " New debit rate: " + newRate + "%"
    let newNode = {
      date: Moment(this.state.intFirstAppliedDate).startOf('date').format(),
      autogen: null,
      type: "manual",
      transactionId: uuid(),
      newRate: newRate / 100,
      credit: this.state.newRateCredit,
      description: desc,
      dbAmount: 0,
      crAmount: 0
    }
    let transAcc = this.props.transAcc
    let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
    acc.trans.push(newNode)
    transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      transAcc,
      today
    )
    this.props.setTransactions(transAcc)
    this.props.setSaveRequired(true)
    this.props.setRecalcRequired(false)
    this.setState( {showInterest: false});
  }

  handleInterestShow = () => {
    this.setState( {showInterest: true});
  }

  handleInterestClose = () => {
    this.setState( {showInterest: false});
  }

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

  validateForm() {
    return (
      this.getNewRateValidationState() !== "error" &&
      this.getFirstAppliedDateValidationState() !== "error"
    )
  }

  getNewRateValidationState() {
    const regex = /^[0-9]+(\.[0-9]{1,2})?$/;
    if (!regex.test(this.state.newRateValue)) return "error";
    let amount = parseFloat(this.state.newRateValue).toFixed(2);
    if (isNaN(amount)) return "error";
    if (amount > 99.99) return "error";
    return "success";
  }

  getFirstAppliedDateValidationState() {
    if (this.state.intFirstAppliedDate === null) return "error";
    if (Moment(this.state.intFirstAppliedDate).isAfter(today.clone().add(30, "y"),"day"))
      return "error";
    let transAcc = this.props.transAcc
    if (transAcc) {
      let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
      if (Moment(this.state.intFirstAppliedDate).isBefore(Moment(acc.openingDate),"day"))
        return "error";
      if (Moment(this.state.intFirstAppliedDate).isAfter(Moment(acc.closingDate),"day"))
        return "error";
    }
    return "success";
  }

  handleFirstAppliedDateChange = value => {
    this.setState({
      intFirstAppliedDate: value
    });
  };

  handleInterestTypeChange = event => {
    this.setState({
      newRateCredit: event.target.checked
    });
  };

  handleFocus = event => {
    event.target.select();
  }

  handleChange = event => {
    this.setState({
      [event.target.id]: event.target.value
    });
  };

  render() {
    let h =
      Math.max(document.documentElement.clientHeight, window.innerHeight || 0) -
      280;
    let divStyle = { boxSizing: "border-box", height: `${h}px` };
    let data = [];
    let currAcc;
    let interestAcc = false;
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
      interestAcc = currAcc.interest;
    }
    if (this.gridApi[this.props.currentAccId])
      this.gridApi[this.props.currentAccId].setRowData(data);

    return (
      <div className="transactions">
        <PageHeader>Transactions</PageHeader>

        <Modal show={this.state.showInterest} onHide={this.handleInterestClose}>
          <Modal.Header closeButton>
              <Modal.Title>Interest Rate Change</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <FormGroup
              controlId="intFirstAppliedDate"
              validationState={this.getFirstAppliedDateValidationState()}
            >
              <ControlLabel>Start Date</ControlLabel>
              <DatePicker
                id="intFirstAppliedDate"
                value={this.state.intFirstAppliedDate}
                placeholder="Date"
                onChange={this.handleFirstAppliedDateChange}
                autoComplete="off"
              />
            </FormGroup>
            <FormGroup
              controlId="newRateValue"
              validationState={this.getNewRateValidationState()}
            >
              <ControlLabel>Interest Rate</ControlLabel>
              <InputGroup>
                <InputGroup.Addon>%</InputGroup.Addon>
                <FormControl
                  type="text"
                  value={this.state.newRateValue}
                  placeholder="Rate"
                  onChange={this.handleChange}
                  onFocus={this.handleFocus}
                />
              </InputGroup>
              <FormControl.Feedback />
            </FormGroup>
            <FormGroup controlId="newRateCredit" validationState="success">
              <Checkbox
                checked={this.state.newRateCredit}
                onChange={this.handleInterestTypeChange}
              >
                Credit Interest
              </Checkbox>
            </FormGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.handleInterestClose}>Close</Button>
            <Button disabled={!this.validateForm()} bsStyle="primary" onClick={this.handleInterestCommit}>Add</Button>
          </Modal.Footer>
        </Modal>


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
                  defaultColDef={this.state.defaultColDef}
                  rowSelection="single"
                  onCellEditingStopped={this.updateRow}
                  onCellClicked={this.onCellClicked}
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
          <div className="col-sm-12">
            <ButtonToolbar id="buttons" className="pull-right">
              <ButtonGroup>
                <Button disabled={!interestAcc} onClick={this.handleInterestShow}>Interest</Button>
                <Button onClick={this.handleAdd}>Add</Button>
                <Button onClick={this.handleDuplicate}>Duplicate</Button>
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
