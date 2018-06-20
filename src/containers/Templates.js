import React, { Component } from "react";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import "./Templates.css";
import "react-bootstrap-table-next/dist/react-bootstrap-table2.min.css";
import BootstrapTable from "react-bootstrap-table-next";
import { API } from "aws-amplify";


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
      const templates = await this.templates();
      this.setState({ templates });
    } catch (e) {
      alert(e);
    }

    this.setState({ isLoading: false });
  }

  templates() {
    return API.get("accounts", "/templates");
    // return [
    //   { id: "1", name: "Tomato", price: "3.50" },
    //   { id: "2", name: "Carrot", price: "0.12" },
    //   { id: "3", name: "Celery", price: "1.80" }
    // ];
  }

  columns = () => [
      {
        dataField: "accountFromId",
        text: "Account"
      },
      {
        dataField: "description",
        text: "Description"
      },
      {
        dataField: "amount",
        text: "Amount"
      }
    ];
  

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
          keyField="id"
          data={this.state.templates}
          columns={this.columns()}
        />
      </div>
    );
  }
}
