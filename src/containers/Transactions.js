import React, { useState, useEffect } from "react"
import { Row, Col, Button, ButtonToolbar, ButtonGroup, Tabs, Tab} from "react-bootstrap"
import Moment from "moment"
import { calculate, deleteFutureAllTransactions, trim, archiveRebalance } from "../libs/calculate"
import { Storage } from "aws-amplify"
import { AgGridColumn, AgGridReact } from "ag-grid-react"
import "ag-grid-community/dist/styles/ag-grid.css"
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css"
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import { today, uuid, beginning } from "../libs/utilities"
import InterestPopUp from "../components/InterestPopUp"
import ArchivePopUp from "../components/ArchivePopUp"
import Summary from "../components/Summary"
import "./Transactions.css"

const Transactions = () => {
  const { isAuthenticated, accounts, templates, transAcc, currentAccId, archive, recalcRequired, saveRequired, saveArchiveRequired,
          setRecalcRequired, setTransAcc, setSaveArchiveRequired, setSaveRequired,
          setArchive, setCurrentAccId } = useAppContext()
  const [gridApi, setGridApi] = useState({})
  const [interestAcc, setInterestAcc] = useState(false)
  const [showInterest, setShowInterest] = useState(false)
  const [showArchive, setShowArchive] = useState(false)
  const [showTrim, setShowTrim] = useState(false)
  const [archiveFile, setArchiveFile] = useState(null)

  useEffect(() => {
    console.log('Transactions: useEffect')

    const onLoad = async () => {
      if (!isAuthenticated) {
        return
      }

      try {
        if (!transAcc)
          await restoreData()
        else
        {
          if (currentAccId)
          {
            const acc = transAcc.find(ta => ta.accountId === currentAccId)
            if (acc) setInterestAcc(acc.interest)
          }
        }
      } catch (e) {
        onError(e)
      }
    }
    onLoad()
  }, [isAuthenticated, transAcc, currentAccId])

  const amountFilterOptions = { 
    filterOptions: [
      {
        displayKey: 'equals',
        displayName: 'Equals',
        test: (filterValue, cellValue) => parseInt(cellValue, 10) / 100 === filterValue
      },
      {
        displayKey: 'lessthan',
        displayName: 'Less than',
        test: (filterValue, cellValue) => parseInt(cellValue, 10) / 100 < filterValue
      },
      {
        displayKey: 'greaterthan',
        displayName: 'Greater than',
        test: (filterValue, cellValue) => parseInt(cellValue, 10) / 100 > filterValue
      }
    ]
  }

  const balanceCellFormatter = params => params.value < 0 ? { color: "red" } : null

  const amountParser = params => {
    const val = Number(params.newValue)
    if (isNaN(val)) return params.oldValue
    return Math.round(val * 100)
  }

  const amountFormatter = params => {
    const val = parseInt(params.value, 10) / 100
    if (val) return val.toFixed(2)
    return ""
  }

  const reconciledFormatter = params => String.fromCharCode(parseInt( params.value === 1 ? "2713" : params.value === 2 ? "2705" : "0020" ,16))

  const reconciledCellStyle = params => ({paddingLeft:`${params.value === 1 ? 0.3 : 0}rem`, 'font-style':'normal', 'text-overflow':'clip'})

  const balanceFormatter = params => (parseInt(params.value, 10) / 100).toFixed(2)

  const dateFormatter = params => Moment(params.value).format("Do MMM YY")

  const dateFilterOptions = { 
    comparator: (filterLocalDateAtMidnight, cellValue) => {
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

  const getRowStyle = params => {
    const rowStyle = {}
    if (Moment(params.node.data.date).startOf("date").isSameOrBefore(today, "day"))
      rowStyle["background-color"] = params.node.rowIndex % 2 === 0 ? "#C3C3C3" : "#D3D3D3"
    if (params.node.rowIndex === 0) rowStyle["font-weight"] = "bold"
    if (!params.node.data.autogen) rowStyle["font-style"] = "italic"
    if (params.node.data.newRate) rowStyle["color"] = "#0000FF"
    return rowStyle
  }

  const rowEditable = node => node.data.transactionId !== 0 && ((Moment(node.data.date).isSameOrBefore(today, "day")) || (!node.data.autogen)) &&  (!node.data.newRate)
 
  const onCellClicked = node => {
    if (node.column.colId === "reconciled" && node.rowIndex > 0)
      if (Moment(node.data.date).isSameOrBefore(today, "day")){
        const localTransAcc = transAcc
        const acc = localTransAcc.find(ta => ta.accountId === currentAccId)
        const trans = acc.trans.find(t => t.transactionId === node.data.transactionId)
        if (isNaN(trans.reconciled) || trans.reconciled === null ) trans.reconciled = 0
        trans.reconciled++
        if (trans.reconciled === 3) trans.reconciled = 0
        node.data.reconciled = trans.reconciled
        setTransAcc(localTransAcc)
        if (archive) setSaveArchiveRequired(true)
        else setSaveRequired(true)
        gridApi[currentAccId].refreshCells()
      }
  }

  const handleRecalculate = () => {
    let localTransAcc
    if (archive) {
      localTransAcc = archiveRebalance( transAcc, today )
      setSaveArchiveRequired(true)
    }
    else {
      localTransAcc = calculate( accounts, templates, transAcc, today )
      setSaveRequired(true)
    }
    setTransAcc(localTransAcc)
    localTransAcc.forEach(account => insertDataIntoGrid(account,gridApi[account.accountId]))
    setRecalcRequired(false)
  }

  const handleSave = async () => {
    const key = "data2.txt"   // need to change this!
    const localTransAcc = deleteFutureAllTransactions(accounts, transAcc, today, false)
    const strToSave = JSON.stringify([accounts, templates, localTransAcc, today.format()])
    console.log(strToSave)
    try {
      await Storage.put(key, strToSave, { level: "private", contentType: "application/json" })
      setSaveRequired(false)
      alert("Transactions saved successfully")
    } 
    catch(e) {
      onError(e)
    }
  }

  const restoreData = async () => {
    const key = "data2.txt"  // need to change this!
    try {
      const data = await Storage.get(key, { level: "private", download: true, cacheControl: 'no-cache' })
      if (!data)
        alert('No transaction data found - without explicit error')
      else if (!data.Body)
        alert('No data body found - without explicit error')
      else {
        const result = await data.Body.text()
        const dataToRestore = JSON.parse(result)
        // Reconstruct data as of when it was saved including using the templates that existed then as well
        // as the date at that time
        let localTransAcc = calculate(...dataToRestore)
        // Now recalculate the data based on today's date and templates
        localTransAcc = calculate( accounts, templates, localTransAcc, today )
        selectAccount(currentAccId)
        setTransAcc(localTransAcc)
        localTransAcc.forEach(account => insertDataIntoGrid(account, gridApi[account.accountId]))
        setSaveRequired(false)
        setSaveArchiveRequired(false)
        setRecalcRequired(false)
        setArchive(false)
      }
    }
    catch (e) {
      if (e.response.status === 403) {
        const localTransAcc = calculate( accounts, templates, [], today )
        setTransAcc(localTransAcc)
        localTransAcc.forEach(account => insertDataIntoGrid(account, gridApi[account.accountId]))
        setSaveRequired(false)
        setSaveArchiveRequired(false)          
        setRecalcRequired(false)
        setArchive(false)
        selectAccount("0")
      } else
        onError(e)
    }
  }

  const handleLoad = async () => {
    if (window.confirm("Are you sure you want to restore the data to the last save point?"))
      await restoreData()
  }

  const insertDataIntoGrid = (account,api) => {
    let data =[]
    if (account) {
      const desc = !account.interest ? "Opening Balance" :
                   `Int=${(account.starting.interest / 100).toFixed(2)} db=${account.starting.dbRate} cr=${account.starting.crRate}`
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
  
  const insertDataIntoCurrentGrid = parmsTransAcc => {
    const acc = parmsTransAcc.find(ta => ta.accountId === currentAccId)
    insertDataIntoGrid( acc, gridApi[acc.accountId] ) 
  }

  const handleDuplicate = () => {
    const nodes = gridApi[currentAccId].getSelectedNodes()
    if (nodes.length) {
      const data = nodes[0].data
      const newDate = Moment(data.date)
      const newNode = {
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
      let localTransAcc = transAcc
      const acc = localTransAcc.find(ta => ta.accountId === currentAccId)
      acc.trans.push(newNode)
      localTransAcc = calculate( accounts, templates, localTransAcc, today )
      setTransAcc(localTransAcc)
      insertDataIntoCurrentGrid(localTransAcc)
      setSaveRequired(true)
      setRecalcRequired(false)
    }
  }
  
  const handleDelete = () => {
    const nodes = gridApi[currentAccId].getSelectedNodes()
    if (nodes.length) {
      let localTransAcc = transAcc
      const acc = localTransAcc.find(ta => ta.accountId === currentAccId)
      acc.trans = acc.trans.filter(t => t.transactionId !== nodes[0].transactionId)

      localTransAcc = calculate( accounts, templates, localTransAcc, today )
      setTransAcc(localTransAcc)
      insertDataIntoCurrentGrid(localTransAcc)
      setSaveRequired(true)
      setRecalcRequired(false)
    }
  }

  const handleManual = () => {
    const nodes = gridApi[currentAccId].getSelectedNodes()
    if (nodes.length) {
      const localTransAcc = transAcc
      const acc = localTransAcc.find(ta => ta.accountId === currentAccId)
      const data = nodes[0].data
      const transToUpdate = acc.trans.find(t => t.transactionId === data.transactionId )
      data.autogen = null
      transToUpdate.autogen = null
      transToUpdate.type = "manual"
      nodes[0].setData(data)
      setTransAcc(localTransAcc)
      setRecalcRequired(true)
      setSaveRequired(true)
      gridApi[currentAccId].refreshCells( { rowNodes: nodes } )
    }
  }

  const handleAdd = () => {
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
    let localTransAcc = transAcc
    const acc = localTransAcc.find(ta => ta.accountId === currentAccId)
    acc.trans.push(newNode)
    localTransAcc = calculate( accounts, templates, localTransAcc, today )
    setTransAcc(localTransAcc)
    insertDataIntoCurrentGrid(localTransAcc)
    setSaveRequired(true)
    setRecalcRequired(false)
  }

  const handleInterestCommit = (newRateValue, newRateCredit, intFirstAppliedDate) => {
    const newRate = parseFloat(newRateValue).toFixed(2)
    const desc = ` New ${newRateCredit ? "credit" : "debit"} rate: ${newRate}%`
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
    let localTransAcc = transAcc
    const acc = localTransAcc.find(ta => ta.accountId === currentAccId)
    acc.trans.push(newNode)
    localTransAcc = calculate( accounts, templates, localTransAcc, today )
    setTransAcc(localTransAcc)
    insertDataIntoCurrentGrid(localTransAcc)
    setSaveRequired(true)
    setRecalcRequired(false)
    setShowInterest(false)
  }

  const handleTrimCommit = trimEndDate => {
    const localTransAcc = transAcc
    const trimDate = Moment(trimEndDate)
    trim(localTransAcc, trimDate)
    setTransAcc(localTransAcc)
    localTransAcc.forEach(account => insertDataIntoGrid( account, gridApi[account.accountId]) )
    setSaveRequired(true)
    setRecalcRequired(true)
    setShowTrim(false)
  }

  const handleArchiveLoad = async () => {
    const key = "archive.json"   // need to change this!
    try {
      const data = await Storage.get(key, { level: "private", download: true, cacheControl: 'no-cache' })
      if (!data)
        alert('No archive found - without explicit error')
      else if (!data.Body)
        alert('No data body found - without explicit error')
      else {
        const result = await data.Body.text()
        const dataToRestore = JSON.parse(result)
        let localTransAcc = []
        if (!Array.isArray(dataToRestore[0])) {
          // console.log('Ultra New archive format')
          localTransAcc = dataToRestore
        } else if ((dataToRestore).length === 4) {
          // console.log('Old archive format')
          localTransAcc = dataToRestore[2]
        } else if ((dataToRestore).length === 2) {
          // console.log('New archive format')
          localTransAcc = dataToRestore[0]
        } else alert('Invalid archive format!')

        setArchiveFile(key)
        setTransAcc(localTransAcc)
        localTransAcc.forEach(account => insertDataIntoGrid( account, gridApi[account.accountId] ))
        selectAccount("0")
        setSaveRequired(false)
        setSaveArchiveRequired(false)
        setRecalcRequired(false)
        setArchive(true)
      }
    }
    catch (e) {
      if (e.response.status === 403) 
        alert("No archive found")
      else
        onError(e)
    }
  }

  const saveArchive = async (key, strToSave) => {
    try {
      await Storage.put(key, strToSave, { level: "private", contentType: "application/json" })
      setSaveRequired(false)
      setSaveArchiveRequired(false)
      alert("Archive saved successfully")
    } 
    catch(e) {
      onError(e)
    }
  }

  const handleArchiveCommit = async archiveEndDate => {
    const endDate = Moment(archiveEndDate)
    const archiveData = deleteFutureAllTransactions( accounts, transAcc, endDate, true )
    const key = `Archive-${endDate.format("YYYY-MM-DD")}.arc`  // needs changing!
    // const key = 'archive.json'
    const strToSave = JSON.stringify(archiveData)
    await saveArchive( key, strToSave)
    setShowArchive(false)
  }

  const handleArchiveSave = async () => {
    const key = archiveFile
    const strToSave = JSON.stringify(transAcc)
    await saveArchive( key, strToSave)
  }

  const updateRow = node => {
    const localTransAcc = transAcc
    const acc = localTransAcc.find(account => account.accountId === currentAccId)
    const data = node.data
    if (Moment(data.date).isAfter(today)) data.reconciled = 0
    const transToUpdate = acc.trans.find(transaction => transaction.transactionId === data.transactionId)
    transToUpdate.description = data.description
    transToUpdate.date = data.date
    transToUpdate.sortKey = Moment(data.date).diff(beginning,'days')
    transToUpdate.reconciled = data.reconciled
    transToUpdate.crAmount = data.crAmount
    transToUpdate.dbAmount = data.dbAmount
    setTransAcc(localTransAcc)
    setRecalcRequired(true)
    if (archive)
      setSaveArchiveRequired(true)
    else
      setSaveRequired(true)
    gridApi[currentAccId].refreshCells()
  }

  const selectAccount = eventKey => {
    setCurrentAccId(eventKey)
    let interestAcc = false
    if (transAcc) {
      const acc = transAcc.find(ta => ta.accountId === eventKey)
      if (acc) interestAcc = acc.interest
    }
    setInterestAcc(interestAcc)
  }

  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 280
  const divStyle = { boxSizing: "border-box", height: `${h}px` }
  const descriptionWidth = Math.min(Math.max(Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 1266,234),630)
  const isSummary = currentAccId === "0"

  const debug = true

  return (
    <div className="transactions">
      <h1>Transactions {archive ? "- ARCHIVE" : ""}</h1>
      {transAcc && 
      <div>
      <InterestPopUp
        show={showInterest} 
        onHide={() => setShowInterest(false)} 
        onSubmit={handleInterestCommit} 
      />
      <ArchivePopUp
        show={showArchive}
        type="Archive"
        onHide={() => setShowArchive(false)}
        onSubmit={handleArchiveCommit}
      />
      <ArchivePopUp
        show={showTrim}
        type="Trim"
        onHide={() => setShowTrim(false)}
        onSubmit={handleTrimCommit}
      />        
      <Tabs
        defaultActiveKey={0}
        transition={false}
        id="trans-tab"
        activeKey={currentAccId}
        onSelect={selectAccount}
      >
        <Tab key={0} eventKey={0} title="Summary">
          <Summary />
        </Tab>
        {transAcc
          .filter(account => !account.hide)
          .sort((a,b) => (a.sortOrder - b.sortOrder))
          .map((ta) => (
            <Tab key={ta.accountId} eventKey={ta.accountId} title={ta.accName}>
              <div
                id="transGrid"
                style={divStyle}
                className="ag-theme-bootstrap"
              >
                <AgGridReact
                  defaultColDef={{
                    resizable : true
                  }}
                  headerHeight={30}
                  rowSelection="single"
                  rowBuffer={30}
                  onCellEditingStopped={updateRow}
                  onCellClicked={onCellClicked}
                  rowDeselection={true}
                  immutableData={true}
                  getRowNodeId={data => data.transactionId}
                  getRowStyle={getRowStyle}
                  isRowSelectable={node => node.data.transactionId !== 0}
                  onGridReady={params => {
                    setGridApi({...gridApi,[ta.accountId]:params.api})
                    const currAcc = transAcc ? transAcc.find(y => y.accountId === ta.accountId) : null
                    insertDataIntoGrid( currAcc, params.api)
                  }}
                >
                  <AgGridColumn headerName="" field="reconciled" width={22} cellStyle={reconciledCellStyle} valueFormatter={reconciledFormatter} ></AgGridColumn>
                  <AgGridColumn headerName="Date" field="date" width={110} filter="agDateColumnFilter" filterParams={dateFilterOptions} cellStyle={{'textAlign':'right'}} valueFormatter={dateFormatter}></AgGridColumn>
                  <AgGridColumn headerName="Description" field="description" width={descriptionWidth} editable={rowEditable} filter="agTextColumnFilter" cellEditor="agTextCellEditor"></AgGridColumn>
                  <AgGridColumn headerName="Debit" field="dbAmount" width={110} editable={rowEditable} type="numericColumn" valueParser={amountParser} valueFormatter={amountFormatter} filter="agNumberColumnFilter" filterParams={amountFilterOptions} cellEditor="agTextCellEditor" cellEditorParams={{ useFormatter: true }}></AgGridColumn>
                  <AgGridColumn headerName="Credit" field="crAmount" width={110} editable={rowEditable} type="numericColumn" valueParser={amountParser} valueFormatter={amountFormatter} filter="agNumberColumnFilter" filterParams={amountFilterOptions} cellEditor="agTextCellEditor" cellEditorParams={{ useFormatter: true }}></AgGridColumn>
                  <AgGridColumn headerName="Balance" field="balance" width={115} type="numericColumn" valueFormatter={balanceFormatter} filter="agNumberColumnFilter" filterParams={amountFilterOptions} cellStyle={balanceCellFormatter}></AgGridColumn>
                  <AgGridColumn headerName="cr" field="crRate" width={80} type="numericColumn" filter="agNumberColumnFilter" filterParams={amountFilterOptions} hide={!debug}></AgGridColumn>
                  <AgGridColumn headerName="db" field="dbRate" width={80} type="numericColumn" filter="agNumberColumnFilter" filterParams={amountFilterOptions} hide={!debug}></AgGridColumn>
                  <AgGridColumn headerName="period" field="periodInterest" width={110} type="numericColumn" filter="agNumberColumnFilter" filterParams={amountFilterOptions} hide={!debug}></AgGridColumn>
                  <AgGridColumn headerName="Line" field="lineInterest" width={110} type="numericColumn" filter="agNumberColumnFilter" filterParams={amountFilterOptions} hide={!debug}></AgGridColumn>
                </AgGridReact>
              </div>
            </Tab>
          ))
        }
      </Tabs>
      <Row>
        <Col>
          <ButtonToolbar id="buttons" className="mb-2 float-right">
            <ButtonGroup className="mr-2">
              <Button variant="outline-secondary" 
                      size="sm" 
                      onClick={handleArchiveLoad}>
                Load Archive
              </Button>
              <Button variant={saveArchiveRequired ? "outline-warning" : "outline-secondary"} 
                      size="sm" 
                      onClick={archive ? handleArchiveSave : () => setShowArchive(true)}
                      disabled={recalcRequired || saveRequired || isSummary }>
                {archive ? "Save" : "Archive"}
              </Button>
              <Button variant="outline-secondary" 
                      size="sm" 
                      onClick={() => setShowTrim(true)}
                      disabled={recalcRequired || saveRequired || archive || isSummary}>
                Trim
              </Button>
              <Button variant="outline-secondary" 
                      size="sm"
                      onClick={() => setShowInterest(true)}
                      disabled={!interestAcc || archive}>
                Interest
              </Button>
              <Button variant="outline-secondary" 
                      size="sm"
                      onClick={handleAdd}
                      disabled={archive || isSummary}>                
                Add
              </Button>
              <Button variant="outline-secondary" 
                      size="sm" 
                      onClick={handleDuplicate}
                      disabled={archive || isSummary}>
                Duplicate
              </Button>
              <Button variant="outline-secondary" 
                      size="sm"
                      onClick={handleDelete} 
                      disabled={archive || isSummary}>
                Delete
              </Button>
              <Button variant="outline-secondary" 
                      size="sm"
                      onClick={handleManual} 
                      disabled={archive || isSummary}>
                Manual
              </Button>
              <Button variant="outline-secondary" 
                      size="sm"
                      onClick={handleLoad}>
                Load
              </Button>
              <Button variant={saveRequired ? "warning" : "outline-secondary"}
                      size="sm"
                      onClick={handleSave}
                      disabled={archive}>
                Save
              </Button>
            </ButtonGroup>
            <ButtonGroup>
              <Button variant={recalcRequired ? "warning" : "success"}
                      size="sm"
                      onClick={handleRecalculate}>
                Recalculate
              </Button>
            </ButtonGroup>
          </ButtonToolbar>
        </Col>
      </Row>
      </div>}
    </div>
  )
}

export default Transactions