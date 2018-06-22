import React, { Component } from "react";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import "./Templates.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import { API } from "aws-amplify";
import Moment from 'moment';

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
      const templates = t1.map(({ accountFromId: afid, ...rest }) => ({
        accountName: accs.find(x => x.accountId === afid).content,
        ...rest
      }));
      this.setState({ templates });
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

  dateFormatter = (cell,row) => {
    if (cell != null)
      return Moment(cell).format("Do MMM YY");
}

  columns = () => [
    {
      dataField: "accountName",
      text: "Account"
    },
    {
      dataField: "description",
      text: "Description"
    },
    {
      dataField: "amount",
      text: "Amount"
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
      text: "Repeat Period"
    },
    {
      dataField: "templateType",
      text: "Type"
    }
  ];

  rowEvents = {
    onClick: (e, row, rowIndex) => {
      e.preventDefault();
      this.props.history.push(`/templates/${row.templateId}`);
  }
};

  render() {
    return (
      <div className="templates">
        <PageHeader>Transaction Templates</PageHeader>
        <ListGroup>
          <ListGroupItem>
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
