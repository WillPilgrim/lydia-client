import React, { Component } from "react";
import { PageHeader, ListGroup, ListGroupItem } from "react-bootstrap";
import "./Templates.css";


export default class Templates extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false
    };
  }

  
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
      </div>
    );
  }
}