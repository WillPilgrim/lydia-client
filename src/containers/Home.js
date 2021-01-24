import React from "react"
import Nav from "react-bootstrap/Nav"
import { Row, Col, Form, Jumbotron } from "react-bootstrap"
import { Link } from "react-router-dom"
import { useAppContext } from "../libs/contextLib"
import "./Home.css"

const Home = () => {

    const { isAuthenticated } = useAppContext()

    const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 430
    const divStyle = { boxSizing: "border-box", height: `${h}px` }

    return (
        <div className="Home">
            <Jumbotron>
                <div className="lander">
                    <h1>Lydia</h1>
                    <p className="text-muted">Take control of your money</p>
                    {isAuthenticated ?
                        <div className="pt-3">
                            <Link to="/help" className="btn btn-info btn-lg">
                                Help
                            </Link>
                        </div> :
                        <div className="pt-3">
                            <Link to="/login" className="btn btn-info btn-lg mr-3">
                                Login
                            </Link>
                            <Link to="/signup" className="btn btn-success btn-lg">
                                Signup
                            </Link>
                        </div>
                    }
                </div>
            </Jumbotron>

            <Row>
                <Col xs={2}>
                    <div className="navMenu">
                        <Nav defaultActiveKey="#" className="flex-column">
                            <Nav.Link href="#">Home</Nav.Link>
                            <Nav.Link href="#showcase" eventKey="showcase">Showcase</Nav.Link>
                            <Nav.Link href="#philosophy" eventKey="philosophy">Philosophy</Nav.Link>
                            <Nav.Link href="#features" eventKey="features">Features</Nav.Link>
                            <Nav.Link href="#packages" eventKey="packages">Packages</Nav.Link>
                            <Nav.Link href="#contact" eventKey="contact">Contact</Nav.Link>
                        </Nav>
                    </div>
                </Col>
                <Col>
                    <div style={divStyle}>
                        <div className="menuContent">
                            <div id="showcase">
                                <h1><b>Showcase.</b></h1>
                                <hr />
                                <p>Some screen shots and the sell job...</p>
                            </div>
                            <div id="philosophy">
                                <h1><b>Philosophy.</b></h1>
                                <hr />
                                <p>What is Lydia all about? Look here!</p>
                            </div>
                            <div id="features">
                                <h1><b>Features.</b></h1>
                                <hr />
                                <p>Key features go here...</p>
                            </div>
                            <div id="packages">
                                <h1><b>Packages.</b></h1>
                                <hr />
                                <p>Some text our prices. Lorem ipsum consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure</p>
                                <Row>
                                    <Col>
                                        <ul>
                                            <li>Free</li>
                                            <li>Feature 1</li>
                                            <li>Feature 2</li>
                                            <li>Feature 3</li>
                                            <li>
                                                <h2>Free</h2>
                                            </li>
                                            <li>
                                                <button>Sign Up</button>
                                            </li>
                                        </ul>
                                    </Col>
                                    <Col>
                                        <ul>
                                            <li>Basic</li>
                                            <li>Feature 1</li>
                                            <li>Feature 2</li>
                                            <li>Feature 3</li>
                                            <li>Feature 4</li>
                                            <li>Feature 5</li>
                                            <li>
                                                <h2>$ 5 per month</h2>
                                            </li>
                                            <li>
                                                <button>Sign Up</button>
                                            </li>
                                        </ul>
                                    </Col>
                                    <Col>
                                        <ul>
                                            <li>Premium</li>
                                            <li>Feature 1</li>
                                            <li>Feature 2</li>
                                            <li>Feature 3</li>
                                            <li>Feature 4</li>
                                            <li>Feature 5</li>
                                            <li>Feature 6</li>
                                            <li>Feature 7</li>
                                            <li>
                                                <h2>$ 10 per month</h2>
                                            </li>
                                            <li>
                                                <button>Sign Up</button>
                                            </li>
                                        </ul>
                                    </Col>
                                </Row>
                            </div>
                            <div id="contact">
                                <h1><b>Contact.</b></h1>
                                <hr />
                                <p>Do you have any suggestions or questions, or just want to leave some feedback? We'd love to hear from you!</p>
                                <Form>
                                    <div>
                                        <label>Name</label>
                                        <input type="text" name="Name" required />
                                    </div>
                                    <div>
                                        <label>Email</label>
                                        <input type="text" name="Email" required />
                                    </div>
                                    <div>
                                        <label>Message</label>
                                        <input type="text" name="Message" required />
                                    </div>
                                    <button type="submit">Send Message</button>
                                </Form>
                            </div>
                        </div>
                    </div>
                </Col>
            </Row>

        </div>
    )
}

export default Home