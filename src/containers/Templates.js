import React, { useState, useEffect } from "react"
import { Row, Col, Button, ButtonGroup } from "react-bootstrap"
import { useHistory } from "react-router-dom"
import { AgGridColumn, AgGridReact } from "ag-grid-react"
import "ag-grid-community/dist/styles/ag-grid.css"
import "ag-grid-community/dist/styles/ag-theme-bootstrap.css"
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import Moment from "moment"
import { periodStringFormatter } from "../libs/utilities"
import "./Templates.css"

const Templates = () => {

  const history = useHistory()
  const { isAuthenticated, templates, accounts, templateColumnState, templateFilterModel, setTemplateColumnState, setTemplateFilterModel } = useAppContext()
  const [localTemplates, setTemplates] = useState(null)
  const [gridApi, setGridApi] = useState(null)
  const [gridColumnApi, setGridColumnApi] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const onLoad = async () => {
      if (!isAuthenticated) {
        return
      }

      try {
        const mappedTemplates = templates.map(
          ({ accountFromId: afid, accountToId: atid, ...rest }) => {
            const  accountFrom = accounts.find(account => account.accountId === afid)
            const  accountTo = accounts.find(account => account.accountId === atid)
            return {
              accountFrom: accountFrom ? accountFrom.accName : "",
              accountTo: accountTo ? accountTo.accName : "",
              ...rest}
          }
        )
        setTemplates(mappedTemplates)
      } catch (e) {
        onError(e)
      }
      setIsLoading(false)
    }
  
    onLoad()
  }, [isAuthenticated, accounts, templates])

  const onGridReady = params => {
    setGridApi(params.api)
    setGridColumnApi(params.columnApi)
  }

  const dateFilterOptions = { 
      comparator: function(filterLocalDateAtMidnight, cellValue) {
        let dateParts = cellValue.substring(0,10).split("-")
        let day = Number(dateParts[2])
        let month = Number(dateParts[1]) - 1
        let year = Number(dateParts[0])
        let cellDate = new Date(year, month, day);
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

  const amountFormatter = params => {
    const val = parseInt(params.value, 10) / 100
    if (val) return val.toFixed(2)
    return ""
  }

  const dateFormatter = params => Moment(params.value).format("Do MMM YY")

  const periodFormatter = params => periodStringFormatter(params.value, params.data.periodCnt)

  const handleNewTemplateClick = event => {
    event.preventDefault();
    history.push(`/templates/new`);
  };

  const handleModify = event => {
    event.preventDefault()
    let nodes = gridApi.getSelectedNodes()
    if (nodes.length) {
      let templateId = nodes[0].data.templateId
      history.push(`/templates/${templateId}`)
    }
  }

  const onFirstDataRendered = params => {
    if (templateColumnState) {
      gridColumnApi.applyColumnState({
        state: templateColumnState,
        applyOrder: true
      })        
    }
    if (templateFilterModel) {
      gridApi.setFilterModel(templateFilterModel)
    }
  }

  const saveColumnState = params => setTemplateColumnState(gridColumnApi.getColumnState())
  
  const saveColumnFilter = params => setTemplateFilterModel(gridApi.getFilterModel())

  let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 400
  let divStyle = { boxSizing: "border-box", height: `${h}px` }
  return (
    !isLoading && (
      <div className="templates">
        <h1>Transaction Templates</h1>

        <div id="tempGrid" style={divStyle} className="ag-theme-alpine">
          <AgGridReact
            defaultColDef={{
              resizable : true,
              filter: true,
              sortable: true
            }}
            rowData={localTemplates}
            rowDeselection={true}
            rowSelection="single"
            onGridReady={onGridReady}
            onFirstDataRendered={onFirstDataRendered}
            onSortChanged={saveColumnState}
            onColumnMoved={saveColumnState}
            onColumnResized={saveColumnState}
            onFilterChanged={saveColumnFilter}
          >
            <AgGridColumn headerName="Account" field="accountFrom" width={130}></AgGridColumn>
            <AgGridColumn headerName="Description" field="description" width={265}></AgGridColumn>
            <AgGridColumn headerName="Amount" field="amount" width={130} type="numericColumn" cellStyle={{'text-align':'right'}} filter="agNumberColumnFilter" filterParams={amountFilterOptions} valueFormatter={amountFormatter}></AgGridColumn>
            <AgGridColumn headerName="Start" field="startDate" width={115} filter="agDateColumnFilter" cellStyle={{'textAlign':'right'}} filterParams={dateFilterOptions} valueFormatter={dateFormatter}></AgGridColumn>
            <AgGridColumn headerName="End" field="endDate" width={115} filter="agDateColumnFilter" cellStyle={{'textAlign':'right'}} filterParams={dateFilterOptions} valueFormatter={dateFormatter}></AgGridColumn>
            <AgGridColumn headerName="Type" field="templateType" width={100}></AgGridColumn>
            <AgGridColumn headerName="Period" field="periodType" width={115} valueFormatter={periodFormatter}></AgGridColumn>
            <AgGridColumn headerName="Partner" field="accountTo" width={120}></AgGridColumn>
          </AgGridReact>
        </div>
        <Row>
          <Col>
            <ButtonGroup id="buttons" className="mb-2 float-right">
              <Button variant="secondary" onClick={handleModify}>Modify</Button>
              <Button variant="primary" onClick={handleNewTemplateClick}>
                New
              </Button>
            </ButtonGroup>
          </Col>
        </Row>
      </div>
    )
  )
}

export default Templates