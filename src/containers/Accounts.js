import React, { Component } from "react"
import {PageHeader, Button, ButtonToolbar} from "react-bootstrap"
import "./Accounts.css"
import AccountHideCellRenderer from "../components/AccountHideCellRenderer.js";
import { AgGridReact } from "ag-grid-react"
import "ag-grid-community/dist/styles/ag-grid.css"
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css"
import Moment from "moment"
import { API } from "aws-amplify"

export default class Accounts extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isLoading: true,
      accounts: [],
      defaultColDef : 
      {
        resizable : true,
        filter: true,
        sortable: true
      },
      columnDefs: [
        {
          headerName: "Name",
          field: "accName",
          cellStyle: this.cellStyleFormatter,
          width: 130
        },
        {
          headerName: "Description",
          field: "description",
          cellStyle: this.cellStyleFormatter,
          width: 430
        },
        {
            headerName: "Opening",
            children: [
                {
                    headerName: "Date",
                    field: "openingDate",
                    width: 120,
                    filter: "agDateColumnFilter",
                    cellStyle: this.cellStyleFormatter,
                    cellStyleRightJustified: true,
                    filterParams: this.dateFilterOptions,
                    valueFormatter: this.dateFormatter
                },
                {
                    headerName: "Balance",
                    field: "amount",
                    width: 125,
                    type: "numericColumn",
                    valueFormatter: this.balanceFormatter,
                    filter: "agNumberColumnFilter",
                    filterParams: this.amountFilterOptions,
                    cellStyle: this.cellStyleFormatter,
                }
            ]
        },
        {
            headerName: "Interest Rate",
            children: [
                {
                    headerName: "Debit",
                    field: "dbRate",
                    width: 110,
                    cellStyle: this.cellStyleFormatter,
                    cellStyleRightJustified: true,
                    filter: "agNumberColumnFilter",
                    filterParams: this.amountFilterOptions,
                    valueFormatter: this.percentFormatter
                },
                {
                    headerName: "Credit",
                    field: "crRate",
                    width: 110,
                    cellStyle: this.cellStyleFormatter,
                    cellStyleRightJustified: true,
                    filter: "agNumberColumnFilter",
                    filterParams: this.amountFilterOptions,
                    valueFormatter: this.percentFormatter
                }
            ]
        },
        {
          headerName: "",
          field: "hide",
          cellRenderer: "btnCellRenderer",
          cellRendererParams: {
            saveAcc: this.saveAccount,
            refreshAcc: this.props.refreshAccounts,
            recalcReq: this.props.setRecalcRequired
          },
          width: 110
        },
      ],
      frameworkComponents: {
        btnCellRenderer: AccountHideCellRenderer
      }
    }
  }

  cellStyleFormatter = params => {
    let cellStyle = {"color":"", "text-decoration": ""}
    if (params.colDef.cellStyleRightJustified) cellStyle["textAlign"] = "right"
    if (params.value < 0) cellStyle["color"] = "red"
    if (params.data.hide) {
      cellStyle["color"] = "#a9a9a9"
      cellStyle["text-decoration"] = "line-through"
     }
    return cellStyle
  }

  dateFilterOptions = { 
      comparator: function(filterLocalDateAtMidnight, cellValue) {
        const dateParts = cellValue.substring(0,10).split("-")
        const day = Number(dateParts[2])
        const month = Number(dateParts[1]) - 1
        const year = Number(dateParts[0])
        const cellDate = new Date(year, month, day)
        if (cellDate < filterLocalDateAtMidnight) return -1
        else if (cellDate > filterLocalDateAtMidnight) return 1
        else return 0
      }
  }

  amountFilterOptions = { 
    filterOptions: [
      {
        displayKey: 'equals',
        displayName: 'Equals',
        test: function(filterValue, cellValue) {
            const temp = parseInt(cellValue, 10) / 100
            return temp === filterValue
        }
      },
      {
        displayKey: 'lessthan',
        displayName: 'Less than',
        test: function(filterValue, cellValue) {
            const temp = parseInt(cellValue, 10) / 100
            return temp < filterValue
        }
      },
      {
        displayKey: 'greaterthan',
        displayName: 'Greater than',
        test: function(filterValue, cellValue) {
            const temp = parseInt(cellValue, 10) / 100
            return temp > filterValue
        }
      }
    ]
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) return
    try {
        const accounts = this.props.accounts
        this.setState({ accounts })
    } catch (e) {
        alert(e)
    }
    this.setState({ isLoading: false })
  }

  saveAccount = account => {
    return API.put("accounts", `/accounts/${account.accountId}`, {
      body: account
    });
  }

  percentFormatter = params => {
    const val = parseFloat(params.value, 10) 
    if (val) return val.toFixed(2)
    return ""
  }

  balanceFormatter = params => (parseInt(params.value, 10) / 100).toFixed(2)

  dateFormatter = params => Moment(params.value).format("Do MMM YY")

  handleNewAccountClick = event => {
    event.preventDefault()
    this.props.history.push(`/accounts/new`)
  }

  handleModify = event => {
    event.preventDefault()
    let nodes = this.gridApi.getSelectedNodes()
    if (nodes.length) {
      let accountId = nodes[0].data.accountId
      this.props.history.push(`/accounts/${accountId}`)
    }
  }

  render() {
    let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 400
    let divStyle = { boxSizing: "border-box", height: `${h}px` }
    return (
      <div className="accounts" style={{height: '100%'}}>
        <PageHeader>Accounts</PageHeader>

        <div id="accGrid" style={divStyle} className="ag-theme-alpine">
          <AgGridReact
            columnDefs={this.state.columnDefs}
            defaultColDef={this.state.defaultColDef}
            frameworkComponents={this.state.frameworkComponents}
            rowData={this.state.accounts}
            rowDeselection={true}
            rowSelection="single"
            onGridReady={params => (this.gridApi = params.api)}
          />
        </div>
        <div className="row">
          <div className="col-sm-12">
            <ButtonToolbar id="buttons" className="pull-right">
              <Button onClick={this.handleModify}>Modify</Button>
              <Button bsStyle="primary" onClick={this.handleNewAccountClick}>
                New
              </Button>
            </ButtonToolbar>
          </div>
        </div>
      </div>
    )
  }
}
