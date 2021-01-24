import React, { useState, useEffect } from "react"
import { Row, Col, Button } from "react-bootstrap"
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
    console.log('Templates: useEffect')
    
    const onLoad = async () => {
      if (!isAuthenticated) return

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

  const TemplateEditCellRenderer = props => 
  <span>
    <button style={{ height: 20, lineHeight: 0.5, width:50}} className="btn btn-primary" 
            onClick={async () => history.push(`/templates/${props.data.templateId}`)}>
      Edit
    </button>
  </span>

  const amountFormatter = params => {
    const val = parseInt(params.value, 10) / 100
    if (val) return val.toFixed(2)
    return ""
  }

  const dateFormatter = params => Moment(params.value).format("Do MMM YY")

  const periodFormatter = params => periodStringFormatter(params.value, params.data.periodCnt)

  const handleNewTemplateClick = event => {
    event.preventDefault()
    history.push(`/templates/new`)
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

  
  const onGridReady = params => {
    setGridApi(params.api)
    setGridColumnApi(params.columnApi)
  }

  const getRowNodeId = data => data.templateId

  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 240
  const divStyle = { boxSizing: "border-box", height: `${h}px` }

  return (
    !isLoading && (
      <div className="Templates">
        <h1>Templates</h1>

        <div id="tempGrid" style={divStyle} className="ag-theme-alpine">
          <AgGridReact
            defaultColDef={{
              resizable : true,
              filter: true,
              sortable: true
            }}
            frameworkComponents={{
              templateEditCellRenderer: TemplateEditCellRenderer
            }}
            rowData={localTemplates}
            onGridReady={onGridReady}
            immutableData={true}
            animateRows={true}
            getRowNodeId={getRowNodeId}
            onFirstDataRendered={onFirstDataRendered}
            onSortChanged={saveColumnState}
            onColumnMoved={saveColumnState}
            onColumnResized={saveColumnState}
            onFilterChanged={saveColumnFilter}
          >
            <AgGridColumn headerName="Account" field="accountFrom" width={127}></AgGridColumn>
            <AgGridColumn headerName="Description" field="description" width={220}></AgGridColumn>
            <AgGridColumn headerName="Amount" field="amount" width={127} type="numericColumn" cellStyle={{'text-align':'right'}} filter="agNumberColumnFilter" filterParams={amountFilterOptions} valueFormatter={amountFormatter}></AgGridColumn>
            <AgGridColumn headerName="Start" field="startDate" width={111} filter="agDateColumnFilter" cellStyle={{'textAlign':'right'}} filterParams={dateFilterOptions} valueFormatter={dateFormatter}></AgGridColumn>
            <AgGridColumn headerName="End" field="endDate" width={111} filter="agDateColumnFilter" cellStyle={{'textAlign':'right'}} filterParams={dateFilterOptions} valueFormatter={dateFormatter}></AgGridColumn>
            <AgGridColumn headerName="Type" field="templateType" width={95}></AgGridColumn>
            <AgGridColumn headerName="Period" field="periodType" width={111} valueFormatter={periodFormatter}></AgGridColumn>
            <AgGridColumn headerName="Partner" field="accountTo" width={119}></AgGridColumn>
            <AgGridColumn headerName="" field="templateId" width={70} cellRenderer='templateEditCellRenderer'></AgGridColumn>
          </AgGridReact>
        </div>
        <Row>
          <Col>
            <Button variant="outline-primary" 
                    block
                    className="mt-2"
                    size="md"
                    onClick={handleNewTemplateClick}>
              Create New Template
            </Button>
          </Col>
        </Row>
      </div>
    )
  )
}

export default Templates