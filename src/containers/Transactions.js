import React, { Component } from "react"
import {PageHeader, Button, ButtonToolbar, ButtonGroup, Tabs, Tab} from "react-bootstrap"
import "./Transactions.css"
import Moment from "moment"
import { calculate, deleteFutureAllTransactions, trim, archiveRebalance } from "../libs/calculate"
import { Storage } from "aws-amplify";
import { AgGridReact } from "ag-grid-react"
import "ag-grid-community/dist/styles/ag-grid.css"
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css"
import { today, uuid, beginning } from "../libs/utilities"
import InterestPopUp from "../components/InterestPopUp"
import ArchivePopUp from "../components/ArchivePopUp"
import Summary from "../components/Summary"

export default class Transactions extends Component {
  constructor(props) {
    super(props);
    this.gridApi = [];
    this.debug = true
    let descriptionWidth = Math.min(Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 1266,234),654)
    this.state = {
      showInterest: false,
      showArchive: false,
      showTrim: false,
      isLoading: true,
      archiveFile: null,
//      archiveDate: null,
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
        },
        {
          headerName: "cr",
          hide: !this.debug,
          field: "crRate",
          width: 80,
          type: "numericColumn",
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions       
        },
        {
          headerName: "db",
          hide: !this.debug,
          field: "dbRate",
          width: 80,
          type: "numericColumn",
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions
        },
        {
          headerName: "period",
          hide: !this.debug,
          field: "periodInterest",
          width: 110,
          type: "numericColumn",
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions       
        },
        {
          headerName: "Line",
          hide: !this.debug,
          field: "lineInterest",
          width: 110,
          type: "numericColumn",
          filter: "agNumberColumnFilter",
          filterParams: this.amountFilterOptions       
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
    if (params.node.data.newRate) rowStyle["color"] = "#0000FF"
    return rowStyle
  }

  rowEditable = node => node.data.transactionId !== 0 && ((Moment(node.data.date).isSameOrBefore(today, "day")) || (!node.data.autogen)) &&  (!node.data.newRate)
 
  onCellClicked = (node) => {
    if (node.column.colId === "reconciled" && node.rowIndex > 0)
      if (Moment(node.data.date).isSameOrBefore(today, "day")){
        let transAcc = this.props.transAcc;
        let acc = transAcc.find(x => x.accountId === this.props.currentAccId);
        let data = node.data;
        let trans = acc.trans.find(x => x.transactionId === data.transactionId);
        if (isNaN(trans.reconciled) || trans.reconciled === null ) trans.reconciled = 0
        trans.reconciled++;
        if (trans.reconciled === 3) trans.reconciled = 0
        node.data.reconciled = trans.reconciled
        this.props.setTransactions(transAcc);
        if (this.props.archive) this.props.setSaveArchiveRequired(true)
        else this.props.setSaveRequired(true)
        this.gridApi[this.props.currentAccId].refreshCells()
      }
  }

  handleRecalculate = () => {
    let transAcc
    if (this.props.archive) {
      transAcc = archiveRebalance(
        this.props.transAcc,
        today
      )
      this.props.setSaveArchiveRequired(true)
    }
    else {
      transAcc = calculate(
        this.props.accounts,
        this.props.templates,
        this.props.transAcc,
        today
      )
       this.props.setSaveRequired(true)
    }
    this.props.setTransactions(transAcc)
    transAcc.forEach(account => this.insertDataIntoGrid(account,this.gridApi[account.accountId]))
    this.props.setRecalcRequired(false)
  }

  handleSave = () => {
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
    let key = "data2.txt";
//   let key = "Archive-2019-05-20.arc"
    let transAcc = [];
    Storage.get(key, { level: "private", download: true })
      .then(result => {
        let res = new TextDecoder("utf-8").decode(result.Body);
        let dataToRestore = JSON.parse(res)
        // Reconstruct data as of when it was saved including using the templates that existed then as well
        // as the date at that time
        transAcc = calculate(...dataToRestore)
        // Now recalculate the data based on today's date and templates
        transAcc = calculate(
          this.props.accounts,
          this.props.templates,
          transAcc,
          today
        )
        let currentAccId = 0;
        if (transAcc.length > 0) currentAccId = transAcc[0].accountId;
        this.selectAccount(currentAccId);
        this.props.setTransactions(transAcc);
        transAcc.forEach(account => this.insertDataIntoGrid(account,this.gridApi[account.accountId]))
        this.props.setSaveRequired(false)
        this.props.setSaveArchiveRequired(false)
        this.props.setRecalcRequired(false);
        this.props.setArchive(false)
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
          this.selectAccount(currentAccId);
          this.props.setTransactions(transAcc);
          transAcc.forEach(account => this.insertDataIntoGrid(account,this.gridApi[account.accountId]))
          this.props.setSaveRequired(false)
          this.props.setSaveArchiveRequired(false)          
          this.props.setRecalcRequired(false);
          this.props.setArchive(false)
        } else console.log(err);
      });
  }

  insertDataIntoGrid = (account,api) => {
    let data =[]
    if (account) {
      let desc = "Opening Balance"
      if (account.interest)
        desc = `Int=${(account.starting.interest / 100).toFixed(2)} db=${account.starting.dbRate} cr=${account.starting.crRate}`
      data = [
        {
          transactionId: 0,
          date: account.starting.date,
          description: desc,
          balance: account.starting.balance
        },
        ...account.trans
      ]
    }
    if (api) {
      api.setRowData(data)
      api.refreshCells()
    }
  }
  
  insertDataIntoCurrentGrid = (transAcc) => {
    const acc = transAcc.find(x => x.accountId === this.props.currentAccId)
    this.insertDataIntoGrid(acc,this.gridApi[acc.accountId])
  }

  handleDuplicate = () => {
    const nodes = this.gridApi[this.props.currentAccId].getSelectedNodes();
    if (nodes.length) {
      const data = nodes[0].data
      const newDate = Moment(data.date)

      let newNode = {
        date: newDate.format("YYYY-MM-DD"),
        sortKey: newDate.diff(beginning,'days'),
        autogen: null,
        type: "manual",
        transactionId: uuid(),
        dbAmount: data.dbAmount,
        crAmount: data.crAmount,
        crRate: data.crRate,
        dbRate: data.dbRate,
        periodInterest: data.periodInterest,
        lineInterest: data.lineInterest,
        description: data.description
      }
      let transAcc = this.props.transAcc
      let acc = transAcc.find(x => x.accountId === this.props.currentAccId)
      acc.trans.push(newNode)
      transAcc = calculate(
        this.props.accounts,
        this.props.templates,
        transAcc,
        today
      )
      this.props.setTransactions(transAcc)
      this.insertDataIntoCurrentGrid(transAcc)
      this.props.setSaveRequired(true)
      this.props.setRecalcRequired(false)
      }
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
      this.insertDataIntoCurrentGrid(transAcc)
      this.props.setSaveRequired(true)
      this.props.setRecalcRequired(false)
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
  }

  handleAdd = () => {
    const newNode = {
      date: today.format("YYYY-MM-DD"),
      sortKey: today.diff(beginning,'days'),
      autogen: null,
      type: "manual",
      transactionId: uuid(),
      dbAmount: 0,
      crAmount: 0,
      description: "New Item"
    }
    let transAcc = this.props.transAcc
    const acc = transAcc.find(x => x.accountId === this.props.currentAccId);
    acc.trans.push(newNode)
    transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      transAcc,
      today
    )
    this.props.setTransactions(transAcc)
    this.insertDataIntoCurrentGrid(transAcc)
    this.props.setSaveRequired(true)
    this.props.setRecalcRequired(false)
  }

  handleInterestCommit = (newRateValue, newRateCredit, intFirstAppliedDate) => {
    const newRate = parseFloat(newRateValue).toFixed(2)
    let desc
    if (newRateCredit) desc = " New credit rate: " + newRate + "%"
    else desc = " New debit rate: " + newRate + "%"
    const newDate = Moment(intFirstAppliedDate)
    const newNode = {
      date: newDate.format("YYYY-MM-DD"),
      sortKey: newDate.diff(beginning,'days'),
      autogen: null,
      type: "manual",
      transactionId: uuid(),
      newRate: newRate / 100,
      credit: newRateCredit,
      description: desc,
      dbAmount: 0,
      crAmount: 0
    }
    let transAcc = this.props.transAcc
    const acc = transAcc.find(x => x.accountId === this.props.currentAccId)
    acc.trans.push(newNode)
    transAcc = calculate(
      this.props.accounts,
      this.props.templates,
      transAcc,
      today
    )
    this.props.setTransactions(transAcc)
    this.insertDataIntoCurrentGrid(transAcc)
    this.props.setSaveRequired(true)
    this.props.setRecalcRequired(false)
    this.setState( {showInterest: false})
  }

  handleTrimCommit = (trimEndDate) => {
    const transAcc = this.props.transAcc
    const trimDate = Moment(trimEndDate)
    trim(transAcc, trimDate)
    this.props.setTransactions(transAcc)
    transAcc.forEach(account => this.insertDataIntoGrid(account,this.gridApi[account.accountId]))
    this.props.setSaveRequired(true)
    this.props.setRecalcRequired(true)
    this.setState( {showTrim: false})
  }

  handleArchiveLoad = () => {
    const key = "archive.json"
    let transAcc = []

    Storage.get(key, { level: "private", download: true })
      .then(result => {
        const res = new TextDecoder("utf-8").decode(result.Body)
        const dataToRestore = JSON.parse(res)
//        transAcc = deleteFutureAllTransactions(dataToRestore[0],dataToRestore[2],dataToRestore[3])
        console.log(dataToRestore)
        if (!Array.isArray(dataToRestore[0])) {
          console.log('Ultra New archive format')
          transAcc = dataToRestore
        } else if ((dataToRestore).length === 4) {
          console.log('Old archive format')
          transAcc = dataToRestore[2]
//          this.setState( {archiveDate: dataToRestore[3]})
        } else if ((dataToRestore).length === 2) {
          console.log('New archive format')
          transAcc = dataToRestore[0]
//          this.setState( {archiveDate: dataToRestore[1]})
        } else console.log('Invalid archive format!')

        this.setState( {archiveFile: key})
        let currentAccId = 0
        if (transAcc.length > 0) currentAccId = transAcc[0].accountId
        this.props.setTransactions(transAcc)
        transAcc.forEach(account => this.insertDataIntoGrid(account,this.gridApi[account.accountId]))
        this.selectAccount(currentAccId)
        this.props.setSaveRequired(false)
        this.props.setSaveArchiveRequired(false)
        this.props.setRecalcRequired(false)
        this.props.setArchive(true)
      })
      .catch(err => {
        if (err.statusCode === 403) alert("No archive found")
        else console.log(err)
      })
  }

  handleArchiveCommit = (archiveEndDate) => {
    const endDate = Moment(archiveEndDate)
    const archive = deleteFutureAllTransactions(this.props.accounts, this.props.transAcc,endDate,true)
    //let key = `Archive-${endDate.format("YYYY-MM-DD")}.arc`
    const key = 'archive.json'
    // this.setState( {archiveDate: endDate.format("YYYY-MM-DD")});
    //const dataToSave = [this.props.accounts,[],archive,endDate.format()]
    // const dataToSave = [archive,endDate.format("YYYY-MM-DD")]
    // const strToSave = JSON.stringify(dataToSave)
    const strToSave = JSON.stringify(archive)
    Storage.put(key, strToSave, {
      level: "private",
      contentType: "application/json"
    })
      .then(result => {
        this.props.setSaveRequired(false)
        this.props.setSaveArchiveRequired(false)
        alert("Archive saved successfully")
    })
      .catch(err => alert(err));
    this.setState( {showArchive: false})
  }

  handleArchiveSave = () => {
    //const endDate = Moment(this.props.archiveDate)
    const key = this.state.archiveFile
    //const dataToSave = [this.props.transAcc,endDate.format("YYYY-MM-DD")]
    //const strToSave = JSON.stringify(dataToSave)
    const strToSave = JSON.stringify(this.props.transAcc)
    Storage.put(key, strToSave, {
      level: "private",
      contentType: "application/json"
    })
      .then(result => {
        this.props.setSaveRequired(false)
        this.props.setSaveArchiveRequired(false)
        alert("Archive saved successfully")
    })
      .catch(err => alert(err))
  }

  handleInterestShow = () => {
    this.setState( {showInterest: true})
  }

  handleInterestClose = () => {
    this.setState( {showInterest: false})
  }

  handleArchiveShow = () => {
    this.setState( {showArchive: true})
  }

  handleArchiveClose = () => {
    this.setState( {showArchive: false})
  }

  handleTrimShow = () => {
    this.setState( {showTrim: true})
  }

  handleTrimClose = () => {
    this.setState( {showTrim: false})
  }

  updateRow = node => {
    const transAcc = this.props.transAcc
    const acc = transAcc.find(account => account.accountId === this.props.currentAccId)
    const data = node.data
    if (Moment(data.date).isAfter(today)) data.reconciled = 0
    const transToUpdate = acc.trans.find(transaction => transaction.transactionId === data.transactionId)
    transToUpdate.description = data.description
    transToUpdate.date = data.date
    transToUpdate.sortKey = Moment(data.date).diff(beginning,'days')
    transToUpdate.reconciled = data.reconciled
    transToUpdate.crAmount = data.crAmount
    transToUpdate.dbAmount = data.dbAmount
    this.props.setTransactions(transAcc)
    this.props.setRecalcRequired(true)
    if (this.props.archive)
      this.props.setSaveArchiveRequired(true)
    else
      this.props.setSaveRequired(true)
    this.gridApi[this.props.currentAccId].refreshCells()
  }

  selectAccount = eventKey => {
    this.props.setCurrentAccId(eventKey)
    let interestAcc = false
    let transAcc = this.props.transAcc
    if (transAcc) {
      let acc = transAcc.find(x => x.accountId === eventKey)
      if (acc) interestAcc = acc.interest
    }
    this.setState({interestAcc})
  }

  render() {
    let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 280;
    let divStyle = { boxSizing: "border-box", height: `${h}px` };
    return (
      <div className="transactions">
        <PageHeader>Transactions {this.props.archive?"- ARCHIVE":""}</PageHeader>
        <InterestPopUp
          showInterest={this.state.showInterest}
          onClose={this.handleInterestClose}
          onSubmit={this.handleInterestCommit}
          transAcc={this.props.transAcc}
          currentAccId={this.props.currentAccId}
        />
        <ArchivePopUp
          showArchive={this.state.showArchive}
          type="Archive"
          onClose={this.handleArchiveClose}
          onSubmit={this.handleArchiveCommit}
          transAcc={this.props.transAcc}
          currentAccId={this.props.currentAccId}
        />
        <ArchivePopUp
          showArchive={this.state.showTrim}
          type="Trim"
          onClose={this.handleTrimClose}
          onSubmit={this.handleTrimCommit}
          transAcc={this.props.transAcc}
          currentAccId={this.props.currentAccId}
        />        
        <Tabs
          defaultActiveKey={1}
          animation={false}
          activeKey={this.props.currentAccId}
          onSelect={this.selectAccount}
          id="trans-tab"
        >
          <Tab key={0} eventKey={0} title="Summary">
            <Summary 
              transAcc={this.props.transAcc}
            />
          </Tab>
          {this.props.transAcc ? this.props.transAcc.map((x, index) => (
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
                  rowBuffer={30}
                  onCellEditingStopped={this.updateRow}
                  onCellClicked={this.onCellClicked}
                  rowDeselection={true}
                  deltaRowDataMode={true}
                  components={this.state.components}
                  getRowNodeId={data => data.transactionId}
                  getRowStyle={this.getRowStyle}
                  isRowSelectable={node => node.data.transactionId !== 0}
                  onGridReady={params => {
                    this.gridApi[x.accountId] = params.api
                    let currAcc;
                    if (this.props.transAcc)
                      currAcc = this.props.transAcc.find(y => y.accountId === x.accountId)
                    this.insertDataIntoGrid(currAcc,params.api)
                  }}
                />
              </div>
            </Tab>
            )) : <div id="transGrid" style={divStyle} className="ag-theme-bootstrap"></div> 
          }
        </Tabs>
        <div className="row">
          <div className="col-sm-12">
            <ButtonToolbar id="buttons" className="pull-right">
              <ButtonGroup>
                <Button onClick={this.handleArchiveLoad}>Load Archive</Button>
                <Button disabled={this.props.recalcRequired || this.props.saveRequired} 
                onClick={this.props.archive ? this.handleArchiveSave : this.handleArchiveShow}
                bsStyle={this.props.saveArchiveRequired ? "warning" : "default"}
                >{this.props.archive ? "Save" : "Archive"}</Button>
                <Button disabled={this.props.recalcRequired || this.props.saveRequired || this.props.archive} onClick={this.handleTrimShow}>Trim</Button>
                <Button disabled={!this.state.interestAcc || this.props.archive} onClick={this.handleInterestShow}>Interest</Button>
                <Button onClick={this.handleAdd} disabled={this.props.archive}>Add</Button>
                <Button onClick={this.handleDuplicate} disabled={this.props.archive}>Duplicate</Button>
                <Button onClick={this.handleDelete} disabled={this.props.archive}>Delete</Button>
                <Button onClick={this.handleManual} disabled={this.props.archive}>Manual</Button>
                <Button onClick={this.handleLoad}>Load</Button>
                <Button
                  bsStyle={this.props.saveRequired ? "warning" : "default"}
                  disabled={this.props.archive}
                  onClick={this.handleSave}
                >
                  Save
                </Button>
              </ButtonGroup>
              <Button
//                disabled={this.props.archive}
                bsStyle={this.props.recalcRequired ? "warning" : "success"}
                onClick={this.handleRecalculate}
              >
                Recalculate
              </Button>
            </ButtonToolbar>
          </div>
        </div>
      </div>
    )
  }
}
