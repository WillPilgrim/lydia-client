import React, { useState, useEffect } from "react"
import { Row, Col, Button, ButtonGroup} from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { AgGridColumn, AgGridReact } from "ag-grid-react"
import "ag-grid-community/dist/styles/ag-grid.css"
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css"
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import Moment from "moment"
import { API } from "aws-amplify"
import "./Accounts.css"

const Accounts = () => {

  const history = useHistory()
  const { isAuthenticated, accounts, refreshAccounts, setRecalcRequired, changeAccountsOrder, saveAccountSet } = useAppContext()
  const [gridApi, setGridApi] = useState(null)
  const [startSortIndex, setStartSortIndex] = useState(-1)

  // useEffect(() => {
  //   console.log('Accounts: useEffect')
  //   const onLoad = async () => {
  //     if (!isAuthenticated) return

  //     try {
  //       setAccounts(accounts)
  //     } catch (e) {
  //       onError(e)
  //     }
  //     setIsLoading(false)
  //   }
  
  //   onLoad()
  // }, [isAuthenticated, accounts])

  const onGridReady = params => setGridApi(params.api)
  
  const saveAccount = account => {
    return API.put("accounts", `/accounts/${account.accountId}`, {
      body: account
    });
  }

  const AccountHideCellRenderer = props => {
    const btnClickedHandler = async () => {
      let account =  props.data
      account.hide = !account.hide
      await saveAccount(account)
      await refreshAccounts()
      setRecalcRequired(true)
      props.api.refreshCells({force:true})
    }

    let buttonName = "Hide"
    if (props.data.hide) buttonName = "Unhide"
    return <span><button style={{ height: 20, lineHeight: 0.5, width:70}} className="btn btn-primary" onClick={btnClickedHandler}>{buttonName}</button></span>
  }

  const AccountEditCellRenderer = props => 
    <span>
      <button style={{ height: 20, lineHeight: 0.5, width:50}} className="btn btn-primary" 
              onClick={async () => history.push(`/accounts/${props.data.accountId}`)}>
        Edit
      </button>
    </span>

  const cellStyleFormatter = params => {
    let cellStyle = {"color":"", "text-decoration": ""}
    if (params.colDef.cellStyleRightJustified) cellStyle["textAlign"] = "right"
    if (params.value < 0) cellStyle["color"] = "red"
    if (params.data.hide) {
      cellStyle["color"] = "#a9a9a9"
      cellStyle["text-decoration"] = "line-through"
     }
    return cellStyle
  }

  const dateFilterOptions = { 
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

  const amountFilterOptions = { 
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

  const percentFormatter = params => {
    const val = parseFloat(params.value, 10) 
    if (val) return val.toFixed(2)
    return ""
  }

  const balanceFormatter = params => (parseInt(params.value, 10) / 100).toFixed(2)

  const dateFormatter = params => Moment(params.value).format("Do MMM YY")

  const handleNewAccountClick = event => {
    event.preventDefault()
    history.push(`/accounts/new`)
  }

  const onRowDragMove = event => {
    const movingNode = event.node
    const overNode = event.overNode
    const rowNeedsToMove = movingNode !== overNode
    if (rowNeedsToMove && overNode) {
      const movingData = movingNode.data
      const overData = overNode.data
      const fromIndex = accounts.indexOf(movingData)
      const toIndex = accounts.indexOf(overData)
      changeAccountsOrder(fromIndex, toIndex, movingData.sortOrder, overData.sortOrder)
      gridApi.setRowData(accounts)
      gridApi.clearFocusedCell()
    }
  }

  const onRowDragEnter = event => {
    // console.log(`${event.type}: index=${accounts.indexOf(event.node.data)}`)
    setStartSortIndex(accounts.indexOf(event.node.data))
  }

  const onRowDragComplete = async event => {
    // console.log(`${event.type}: index=${accounts.indexOf(event.node.data)}`)
    const endIndex = accounts.indexOf(event.node.data)
    const startLoop = Math.min(startSortIndex, endIndex)
    const endLoop = Math.max(startSortIndex, endIndex)
    if (startLoop !== endLoop) await saveAccountSet(startLoop, endLoop)
  }

  const getRowNodeId = data => data.accountId
  
  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 400
  const divStyle = { boxSizing: "border-box", height: `${h}px` }
  
  return (
    <div className="accounts">
      <h1>Accounts</h1>

      <div id="accGrid" style={divStyle} className="ag-theme-alpine">
        <AgGridReact
          defaultColDef={{
            resizable : true,
            filter: false,
            sortable: false
          }}
          frameworkComponents={{
            accountHideCellRenderer: AccountHideCellRenderer,
            accountEditCellRenderer: AccountEditCellRenderer
          }}
          rowData={accounts}
          rowDeselection={true}
          rowSelection="single"
          onGridReady={onGridReady}
          immutableData={true}
          animateRows={true}
          getRowNodeId={getRowNodeId}
          onRowDragMove={onRowDragMove}
          onRowDragEnter={onRowDragEnter}
          onRowDragEnd={onRowDragComplete}
          onRowDragLeave={onRowDragComplete}
        >
          <AgGridColumn headerName="Name" field="accName" cellStyle={cellStyleFormatter} width={130} rowDrag={true}></AgGridColumn>
          <AgGridColumn headerName="Description" field="description" cellStyle={cellStyleFormatter} width={325}></AgGridColumn>
          <AgGridColumn headerName="Opening">
            <AgGridColumn headerName="Date" field="openingDate" width={120} cellStyle={cellStyleFormatter} cellStyleRightJustified={true} filter="agDateColumnFilter" filterParams={dateFilterOptions} valueFormatter={dateFormatter}></AgGridColumn>
            <AgGridColumn headerName="Balance" field="amount" width={125} type="numericColumn" cellStyle={cellStyleFormatter} cellStyleRightJustified={true} filter="agNumberColumnFilter" filterParams={amountFilterOptions} valueFormatter={balanceFormatter}></AgGridColumn>
          </AgGridColumn>
          <AgGridColumn headerName="Interest Rate">
            <AgGridColumn headerName="Debit" field="dbRate" width={110} cellStyle={cellStyleFormatter} cellStyleRightJustified={true} filter="agNumberColumnFilter" filterParams={amountFilterOptions} valueFormatter={percentFormatter}></AgGridColumn>
            <AgGridColumn headerName="Credit" field="crRate" width={110} cellStyle={cellStyleFormatter} cellStyleRightJustified={true} filter="agNumberColumnFilter" filterParams={amountFilterOptions} valueFormatter={percentFormatter}></AgGridColumn>
          </AgGridColumn>
          <AgGridColumn headerName="" field="hide" width={89} cellRenderer='accountHideCellRenderer' cellRendererParams={{saveAcc:saveAccount,refreshAcc:refreshAccounts,recalcReq:setRecalcRequired}}></AgGridColumn>
          <AgGridColumn headerName="" field="accountId" width={80} cellRenderer='accountEditCellRenderer' cellRendererParams={{saveAcc:saveAccount,refreshAcc:refreshAccounts,recalcReq:setRecalcRequired}}></AgGridColumn>
        </AgGridReact>
      </div>
      <Row>
          <Col>
            <ButtonGroup id="buttons" className="mb-2 float-right">
              <Button variant="primary" onClick={handleNewAccountClick}>
                New
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
    </div>
  )
}

export default Accounts