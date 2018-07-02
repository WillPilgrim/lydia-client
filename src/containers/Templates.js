import React, { Component } from "react";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import "./Templates.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import { API } from "aws-amplify";
import Moment from "moment";

export default class Templates extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      templates: []
    };
  }

  async componentDidMount() {
    if (!this.props.isAuthenticated) {
      return;
    }
    try {
      const accs = await this.accounts();
      const t1 = await this.templates();
      const templates = t1.map(({ accountFromId: afid, accountToId: atid, ...rest }) => ({
        accountFrom: accs.find(x => x.accountId === afid).accName,
        accountTo: atid==="0"?"":accs.find(x => x.accountId === atid).accName,
        ...rest
      }));
      this.setState({ templates, accs });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  accounts() {
    return API.get("accounts", "/accounts");
  }

  templates() {
    return API.get("accounts", "/templates");
  }

  dateFormatter = (cell, row) => {
    if (cell != null) return Moment(cell).format("Do MMM YY");
  };

  amountFormatter = (cell, row) => {
    if (cell != null) return (parseInt(cell,10)/100).toFixed(2);
  };

  periodFormatter = (cell, row) => {
    let period;

    if (row.periodCnt === 1) {
      switch (row.periodType) {
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
        switch (row.periodType) {
            case "y":
                if (row.periodCnt === 2) period = "Biannually"
                else  period = `${row.periodCnt} yearly`;
              break;
            case "Q":
            period = `${row.periodCnt} quarterly`;
              break;
            case "M":
              if (row.periodCnt === 2) period = "Bimonthly"
              else  period = `${row.periodCnt} monthly`;
            break;
            case "w":
              if (row.periodCnt === 2) period = "Fortnightly"
              else  period = `${row.periodCnt} weekly`;
              break;
            case "d":
              period = `Every ${row.periodCnt} days`;
              break;
            default:
              period = "unknown";
          }
    
    }
    return period;
  };

  columns = () => [
    {
      dataField: "accountFrom",
      text: "Account"
    },
    {
      dataField: "description",
      text: "Description"
    },
    {
      dataField: "amount",
      text: "Amount",
      align: "right",
      formatter: this.amountFormatter
    },
    {
      dataField: "startDate",
      text: "Start Date",
      formatter: this.dateFormatter
    },
    {
      dataField: "endDate",
      text: "End Date",
      formatter: this.dateFormatter
    },
    {
      dataField: "periodType",
      text: "Repeat Period",
      formatter: this.periodFormatter
    },
    {
      dataField: "templateType",
      text: "Type"
    },
    {
        dataField: "accountTo",
        text: "'To' Account"
    }
  ];

  rowEvents = {
    onClick: (e, row, rowIndex) => {
      e.preventDefault();
      this.props.history.push(`/templates/${row.templateId}`);
    }
  };

  handleNewTemplateClick = event => {
    event.preventDefault();
    this.props.history.push(event.currentTarget.getAttribute("href"));
  };

  render() {
    return (
      <div className="templates">
        <PageHeader>Transaction Templates</PageHeader>
        <ListGroup>
          <ListGroupItem
            key="new"
            href="/templates/new"
            onClick={this.handleNewTemplateClick}
          >
            <h4>
              <b>{"\uFF0B"}</b> Create a new template
            </h4>
          </ListGroupItem>
        </ListGroup>
        <BootstrapTable
          keyField="templateId"
          data={this.state.templates}
          columns={this.columns()}
          rowEvents={this.rowEvents}
        />
      </div>
    );
  }
}
