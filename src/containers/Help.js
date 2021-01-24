import React from "react"
import Nav from "react-bootstrap/Nav"
import { Row, Col } from "react-bootstrap"
import "./Help.css"

const Help = () => {

  const h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0) - 165
  const divStyle = { boxSizing: "border-box", height: `${h}px` }
  
  return (
    <div className="Help">
        <div className="title">
            <h1>Help</h1>
        </div>
        <Row>
            <Col xs={2}>
                <Nav defaultActiveKey="#" className="flex-column">
                    <Nav.Link href="#gettingstarted" eventKey="gettingstarted">Getting Started</Nav.Link>
                    <Nav.Link href="#accounts" eventKey="accounts">Accounts</Nav.Link>
                    <Nav.Link href="#templates" eventKey="templates">Templates</Nav.Link>
                    <Nav.Link href="#transactions" eventKey="transactions">Transactions</Nav.Link>
                    <Nav.Link href="#basic" eventKey="basic">Basic Scenarios</Nav.Link>
                    <Nav.Link href="#advanced" eventKey="advanced">Advanced Scenarios</Nav.Link>
                </Nav>
            </Col>

            <Col>
                <div style={divStyle}>
                    <div className="ContentArea">
                        <div id="gettingstarted">
                            <h1><b>Getting Started</b></h1>
                            <hr />
                            <p>First of all you need to create an account...</p>
                            <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas auctor porta fermentum. Aliquam quis velit blandit, tempor lacus non, ullamcorper leo. Praesent est nisl, sagittis quis tortor sed, molestie dignissim lorem. Mauris fringilla in magna ac blandit. Integer nisi ex, hendrerit sit amet interdum in, gravida ac nulla. Nunc at sem id metus dapibus volutpat. Aliquam eu vehicula sapien. Cras maximus dolor maximus varius interdum. Donec accumsan ligula venenatis nunc tempor, quis viverra lorem iaculis. Fusce vel egestas purus. Suspendisse eu ante in est laoreet lobortis. Sed interdum placerat nisi, non cursus ipsum dictum id. Aliquam euismod quis enim id ullamcorper. Suspendisse eget ipsum massa.

Morbi tincidunt, arcu ut ullamcorper sodales, ligula dolor aliquet enim, quis egestas lectus nibh eget lectus. Vestibulum non lorem imperdiet, suscipit justo id, viverra dolor. Vestibulum at eleifend nulla. Nam posuere, massa et tempus interdum, elit mauris cursus lectus, non viverra sapien sapien ut neque. Maecenas rhoncus blandit lorem vitae elementum. Praesent commodo, massa in pretium rutrum, eros enim congue orci, eu blandit risus lacus suscipit tortor. Suspendisse potenti. Vivamus pharetra eros mauris, eget aliquet lectus laoreet eu. Integer vehicula tellus quis sodales commodo. Sed placerat convallis pretium. Proin viverra, diam a pellentesque vehicula, odio dolor iaculis purus, eu lacinia erat sapien sed nibh. Cras tristique dapibus sagittis. Integer ex est, imperdiet in metus eu, tempus accumsan enim. Morbi et pellentesque lectus, quis aliquet libero. In ipsum odio, mattis eget porttitor et, dignissim non urna. Etiam quis mauris convallis, molestie dolor ut, condimentum nisl.
                        </p>
                        </div>
                        <div id="accounts">
                            <h1><b>Accounts</b></h1>
                            <hr />
                            <p>Use the accounts menu item to list all of your accounts...</p>
                            <p>
                            Ut luctus ultricies mauris. Sed imperdiet mi id justo suscipit maximus. Curabitur ut sodales augue. Etiam ut quam porta, congue massa sed, laoreet est. Aenean nec metus risus. Cras porta elit venenatis, congue ligula sit amet, vehicula arcu. Phasellus molestie iaculis tellus non tincidunt. Phasellus est elit, sodales sed egestas quis, molestie in magna. Nunc ut elit lacus.

Integer sit amet scelerisque sem, et maximus felis. Ut dignissim eleifend arcu, at facilisis arcu lacinia vitae. Aenean id scelerisque tellus, ut sodales massa. Quisque id ex sit amet velit auctor condimentum quis ut metus. Donec et fermentum magna. Aenean ut varius dui. Cras vel pharetra lectus, sed mollis enim. Suspendisse tempus nunc in eros cursus maximus. Curabitur eget semper ipsum, et bibendum leo. Praesent id metus ac nisi condimentum consequat. Sed tempor tincidunt magna vitae rhoncus. Duis varius magna quis arcu vehicula, a tempor ante semper. Proin urna ligula, eleifend quis gravida nec, tincidunt finibus enim. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Donec accumsan aliquet tempor.
                            </p>
                        </div>
                        <div id="templates">
                            <h1><b>Templates</b></h1>
                            <hr />
                            <p>Use the templates menu item to list all of your templates...</p>
                        </div>
                        <div id="transactions">
                            <h1><b>Transactions</b></h1>
                            <hr />
                            <p>Use the transactions menu item to show all of the transactions for your accounts...</p>
                        </div>
                        <div id="basic">
                            <h1><b>Basic Scenarios</b></h1>
                            <hr />
                            <p>Most use cases are covered by just three transaction types:</p>
                            <ol>
                                <li>Deposits</li>
                                <li>Withdrawals</li>
                                <li>Transfers</li>
                            </ol>
                        </div>
                        <div id="advanced">
                            <h1><b>Advanced Scenarios</b></h1>
                            <hr />
                            <p>Lydia supports a number of more complex use cases. These are:</p>
                            <ol>
                                <li>Calculating debit and credit interest for specific accounts</li>
                                <li>Creating a credit card payoff mechanism</li>
                                <li>Dynamically transfering from an account ensuring a minimum balance</li>
                                <li>One off withdrawal of all funds from an account</li>
                            </ol>
                            <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ligula neque, cursus a sem vitae, pulvinar elementum purus. Nulla at elementum erat. Aliquam egestas, sapien id ullamcorper accumsan, felis lectus scelerisque nibh, sed placerat dolor urna ut eros. Maecenas viverra a est quis finibus. Aenean volutpat sed odio quis convallis. Nullam rhoncus mi eleifend diam mattis porta. Nulla eu lacinia enim, non blandit mauris.

Suspendisse vel ante cursus, luctus eros at, interdum lectus. Nullam rutrum mattis orci, eget scelerisque ante fermentum eu. Sed mauris quam, maximus ut lorem sed, gravida tristique sem. Cras sollicitudin tortor enim, id pharetra risus porttitor vel. Nunc consectetur interdum neque eu tincidunt. Cras nec justo eu lacus vehicula porttitor. Curabitur massa lectus, sodales ac lectus ut, blandit convallis ipsum. Maecenas suscipit, mauris sit amet vehicula facilisis, quam nibh eleifend dui, eget interdum eros augue non neque. Nullam vel erat sit amet dolor ornare consequat et commodo dui. Phasellus vel facilisis risus, at interdum eros.

In hac habitasse platea dictumst. Aenean euismod erat rutrum metus lobortis, vel tincidunt magna facilisis. Ut eleifend neque eget hendrerit aliquam. Fusce finibus sed tortor tempor lobortis. Fusce viverra ex ut sagittis interdum. Nullam fermentum efficitur nisi, vel molestie tortor sodales eu. Aliquam nibh magna, posuere eget diam et, bibendum dapibus odio.

Ut augue quam, consequat ut erat vel, suscipit porttitor est. Donec id mauris sit amet tellus molestie finibus vel non dui. Nullam quis lobortis justo. Proin pharetra, erat et pretium cursus, neque tellus bibendum velit, sed vulputate quam purus eu erat. Nullam posuere dolor ac dolor commodo, ac scelerisque nisl porttitor. Nunc sodales quis ante vel eleifend. Vivamus quis orci vestibulum, mollis dui sit amet, fermentum turpis. Nulla nec erat dui. Praesent venenatis ac magna sit amet vulputate. Proin sed convallis metus.

Praesent volutpat suscipit nisl vitae tincidunt. Nulla mollis vel metus id condimentum. Integer dapibus bibendum interdum. Curabitur faucibus odio eros, sit amet auctor nunc ultrices ut. Donec sit amet sem eu arcu sodales cursus vel in ex. Cras maximus iaculis nunc id blandit. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin at neque sit amet turpis volutpat pharetra et eget diam. Mauris feugiat, lorem sed tempor tincidunt, turpis risus mollis erat, eu egestas sem augue ut elit. Ut enim elit, rutrum ac tristique eget, egestas in dolor. Phasellus ut aliquet augue. Aenean commodo mattis velit, ac blandit tellus dignissim quis. Morbi nec placerat erat. Curabitur interdum libero sit amet nunc mollis luctus. Integer in scelerisque augue.
                            </p>
                        </div>
                    </div>    
                </div>
            </Col>
        </Row>
    </div>
  )
}

export default Help