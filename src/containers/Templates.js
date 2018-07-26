import React, { Component } from "react";
import {
  PageHeader,
  Button,
  ButtonToolbar
} from "react-bootstrap";
import "./Templates.css";
import { AgGridReact } from "ag-grid-react";
import "ag-grid/dist/styles/ag-grid.css";
import "ag-grid/dist/styles/ag-theme-bootstrap.css";
import Moment from "moment";

export default class Templates extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      templates: [],
      columnDefs: [
        {
          headerName: "Account",
          field: "accountFrom",
          width: 120
        },
        {
          headerName: "Description",
          field: "description",
          width: 290
        },
        {
          headerName: "Amount",
          field: "amount",
          width: 120,
          type: "numericColumn",
          valueFormatter: this.amountFormatter
        },
        {
          headerName: "Start Date",
          field: "startDate",
          width: 140,
          valueFormatter: this.dateFormatter
        },
        {
          headerName: "End Date",
          field: "endDate",
          width: 140,
          valueFormatter: this.dateFormatter
        },
        {
          headerName: "Type",
          field: "templateType",
          width: 100
        },
        {
          headerName: "Period",
          field: "periodType",
          width: 100,
          valueFormatter: this.periodFormatter
        },

        {
          headerName: "Partner",
          field: "accountTo",
          width: 110
        }
      ]
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }
    try {
      const t1 = this.props.templates;
      const templates = t1.map(
        ({ accountFromId: afid, accountToId: atid, ...rest }) => ({
          accountFrom: this.props.accounts.find(x => x.accountId === afid)
            .accName,
          accountTo:
            atid === "0"
              ? ""
              : this.props.accounts.find(x => x.accountId === atid).accName,
          ...rest
        })
      );
      this.setState({ templates });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  amountFormatter = params => {
    let val = parseInt(params.value, 10) / 100;
    if (val) return val.toFixed(2);
    return "";
  };

  dateFormatter = params => Moment(params.value).format("Do MMM YY");

  periodFormatter = params => {
    let period;
    let periodCnt = params.data.periodCnt;
    if (periodCnt === 1) {
      switch (params.value) {
        case "y":
          period = "Annually";
          break;
        case "Q":
          period = "Quarterly";
          break;
        case "M":
          period = "Monthly";
          break;
        case "w":
          period = "Weekly";
          break;
        case "d":
          period = "Daily";
          break;
        default:
          period = "unknown";
      }
    } else {
      switch (params.value) {
        case "y":
          if (periodCnt === 2) period = "Biannually";
          else period = `${periodCnt} yearly`;
          break;
        case "Q":
          period = `${periodCnt} quarterly`;
          break;
        case "M":
          if (periodCnt === 2) period = "Bimonthly";
          else period = `${periodCnt} monthly`;
          break;
        case "w":
          if (periodCnt === 2) period = "Fortnightly";
          else period = `${periodCnt} weekly`;
          break;
        case "d":
          period = `Every ${periodCnt} days`;
          break;
        default:
          period = "unknown";
      }
    }
    return period;
  };

  rowEvents = {
    onClick: (e, row, rowIndex) => {
      e.preventDefault();
      this.props.history.push(`/templates/${row.templateId}`);
    }
  };

  handleNewTemplateClick = event => {
    event.preventDefault();
    //    this.props.history.push(event.currentTarget.getAttribute("href"))
    this.props.history.push(`/templates/new`);
  };

  handleModify = event => {
    event.preventDefault()
    let nodes = this.gridApi.getSelectedNodes()
    if (nodes.length) {
      let templateId = nodes[0].data.templateId
      this.props.history.push(`/templates/${templateId}`)
    }
  }

  render() {
    let h =
      Math.max(document.documentElement.clientHeight, window.innerHeight || 0) -
      400;
    let divStyle = { boxSizing: "border-box", height: `${h}px` };
    return (
      <div className="templates">
        <PageHeader>Transaction Templates</PageHeader>

        <div id="tempGrid" style={divStyle} className="ag-theme-bootstrap">
          <AgGridReact
            enableSorting={true}
            enableFilter={true}
            columnDefs={this.state.columnDefs}
            rowData={this.state.templates}
            rowDeselection={true}
            enableColResize={true}
            rowSelection="single"
            onGridReady={params => (this.gridApi = params.api)}
          />
        </div>
        <div className="row">
          <div className="col-sm-12">
            <ButtonToolbar id="buttons" className="pull-right">
              <Button onClick={this.handleModify}>Modify</Button>
              <Button bsStyle="primary" onClick={this.handleNewTemplateClick}>
                New
              </Button>
            </ButtonToolbar>
          </div>
        </div>
      </div>
    );
  }
}
