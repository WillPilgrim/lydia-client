import React, { Component } from "react"
import { AgGridReact } from "ag-grid-react"
import "./Summary.css"

class Summary extends Component {
  constructor(props) {
    super(props)
    this.state = {
      defaultColDef:
      {
          resizable: true
      },
      columnDefs: [
        {
          headerName: "Name",
          field: "accName",
          width: 120
        },
        {
          headerName: "Description",
          field: "description",
          width: 480
        },
        {
          headerName: "Debit Rate",
          field: "currentDbRate",
          width: 135,
          cellStyle: { textAlign: "right" },
          valueFormatter: this.percentFormatter
        },
        {
          headerName: "Credit Rate",
          field: "currentCrRate",
          width: 135,
          cellStyle: { textAlign: "right" },
          valueFormatter: this.percentFormatter
        },
        {
          headerName: "Balance",
          field: "currentBal",
          width: 135,
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
      ],
      rowClassRules: {
        "total-line": "data.total"
      }
    }
  }

  percentFormatter = params => {
    const val = parseFloat(params.value, 10) 
    if (val) return val.toFixed(2)
    return ""
  }

  balanceFormatter = params => {
    if(typeof params.value === "undefined") return ""
    const val = (parseInt(params.value, 10) / 100).toFixed(2)
    return val
  }

  render() {
    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 400
    const divStyle = { boxSizing: "border-box", height: `${h}px` }
    const transAcc = this.props.transAcc
    let total = 0
    const accounts = transAcc ? transAcc.map(account => {
      const newAccount = { ...account, total: false, dataline: true }
      total += account.currentBal
      return newAccount
    }) : []
    accounts.push({total: false, dataline: false})
    accounts.push({description:"Total", currentBal: total, total: true, dataline: false})
    return (
        <div id="accSummary" style={divStyle} className="ag-theme-bootstrap">
        <AgGridReact
            columnDefs={this.state.columnDefs}
            defaultColDef={this.state.defaultColDef}
            rowData={accounts}
            rowDeselection={true}
            rowSelection="single"
            rowClassRules={this.state.rowClassRules}
            onGridReady={params => (this.gridApi = params.api)}
        />
      </div>
    )
  }
}

export default Summary