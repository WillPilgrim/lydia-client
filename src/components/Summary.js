import React, { useState, useEffect } from "react"
import { AgGridReact, AgGridColumn } from "ag-grid-react"
import { useAppContext } from "../libs/contextLib"

import "./Summary.css"

const Summary = () => {

  const { isAuthenticated, transAcc } = useAppContext()
  const [accountRows, setAccountRows] = useState(null)

  useEffect(() => {
    console.log('Summary: useEffect')

    const onLoad = async () => {

      if (!isAuthenticated) return

      let total = 0

      const accountRows = transAcc ? transAcc.filter(account => !account.hide).map(account => {
        const newAccount = { ...account, totalLine: false }
        total += account.currentBal
        return newAccount
      }) : []
      accountRows.push({totalLine: false })
      accountRows.push({description:"Total", currentBal: total, totalLine: true })

      setAccountRows(accountRows)

    }
  
    onLoad()
  }, [isAuthenticated, transAcc])

  const percentFormatter = params => {
    const val = parseFloat(params.value, 10) 
    if (val) return val.toFixed(2)
    return ""
  }

  const balanceFormatter = params => {
    if (typeof params.value === "undefined") return ""
    const val = (parseInt(params.value, 10) / 100).toFixed(2)
    return val
  }

  const cellStyleAmountFormatter = params => {
    let cellStyle = {"textAlign":"right"}
    if (params.value < 0) cellStyle["color"] = "red"
    return cellStyle
  }

  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 280
  const divStyle = { boxSizing: "border-box", height: `${h}px` }
  
  return (
    <div id="accSummary" style={divStyle} className="ag-theme-alpine">
      <AgGridReact
          defaultColDef={{ resizable : true }}
          rowData={accountRows}
          rowClassRules={{"total-line": "data.totalLine"}}>
          <AgGridColumn headerName="Name" field="accName" width={170}></AgGridColumn>
          <AgGridColumn headerName="Description" field="description" width={500}></AgGridColumn>
          <AgGridColumn headerName="Debit Rate" field="currentDbRate" width={140} cellStyle={cellStyleAmountFormatter} valueFormatter={percentFormatter}></AgGridColumn>
          <AgGridColumn headerName="Credit Rate" field="currentCrRate" width={140} cellStyle={cellStyleAmountFormatter} valueFormatter={percentFormatter}></AgGridColumn>
          <AgGridColumn headerName="Balance" field="currentBal" width={135} type="numericColumn" cellStyle={cellStyleAmountFormatter} valueFormatter={balanceFormatter}></AgGridColumn>
      </AgGridReact>
    </div>
  )

}

export default Summary