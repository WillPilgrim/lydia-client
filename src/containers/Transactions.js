import React, { Component } from "react";
import { PageHeader, ListGroup, ListGroupItem, Button, ButtonToolbar, ButtonGroup } from "react-bootstrap";
import { Pagination, NavItem } from "react-bootstrap";
import "./Transactions.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import { API } from "aws-amplify";
import Moment from 'moment';

export default class Transactions extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true,
            templates: [],
            transactions: []
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

    dateFormatter = (cell, row) => {
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
            this.props.history.push(`/transactions/${row.templateId}`);
        }
    };

    handleNewTemplateClick = event => {
        event.preventDefault();
        this.props.history.push(event.currentTarget.getAttribute("href"));
    }

    render() {
        const pages=['hat','glove','sock','shoes','tie','pants','belt','shirt','jacket','thongs','sandals',
        'hat','glove','sock','shoes','tie','pants','belt','shirt','jacket','thongs','sandals']
        return (
            <div className="transactions">
                <PageHeader>Transactions</PageHeader>
                <ButtonToolbar>
                    <ButtonGroup>
  <Button>Load</Button>
  <Button>Save</Button>
  </ButtonGroup>
  <Button bsStyle="primary">Recalculate</Button>
</ButtonToolbar>

                <BootstrapTable
                    keyField="transactionId"
                    data={this.state.transactions}
                    columns={this.columns()}
                    rowEvents={this.rowEvents}
                />
                <Pagination>
  <Pagination.First />
  <Pagination.Prev />
  {pages.map(x=><Pagination.Item>{x}</Pagination.Item>)}
  <Pagination.Next />
  <Pagination.Last />
</Pagination>
            </div>
        );
    }
}
