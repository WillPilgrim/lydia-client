import React, { useState, useEffect } from "react"
import ListGroup from "react-bootstrap/ListGroup"
import { BsCreditCard } from "react-icons/bs";
import { LinkContainer } from "react-router-bootstrap";
import { useAppContext } from "../libs/contextLib"
import { onError } from "../libs/errorLib"
import { API } from "aws-amplify"
import "./Home.css"

export default () => {
  const [accounts, setAccounts] = useState([])
  const { isAuthenticated } = useAppContext()
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const onLoad = async () => {
      if (!isAuthenticated) {
        return
      }
  
      try {
        const accounts = await loadAccounts();
        setAccounts(accounts);
      } catch (e) {
        onError(e)
      }
  
      setIsLoading(false)
    }
  
    onLoad()
  }, [isAuthenticated])
  
  const loadAccounts = () => {
    return API.get("accounts", "/accounts")
  }

  const renderAccountsList = (accounts) => {
    return (
      <>
        <LinkContainer to="/accounts/new">
          <ListGroup.Item action className="py-3 text-nowrap text-truncate">
            <BsCreditCard size={17} />
            <span className="ml-2 font-weight-bold">Create a new account</span>
          </ListGroup.Item>
        </LinkContainer>
        {accounts.map(({ accountId, accName }) => (
          <LinkContainer key={accountId} to={`/accounts/${accountId}`}>
            <ListGroup.Item action>
              <span className="font-weight-bold">
                {accName.trim().split("\n")[0]}
              </span>
            </ListGroup.Item>
          </LinkContainer>
        ))}
      </>
    );
  }

  const renderLander = () => {
    return (
      <div className="lander">
        <h1>Lydia</h1>
        <p className="text-muted">Take control of your money</p>
      </div>
    )
  }

  const renderAccounts = () => {
    return (
      <div className="accounts">
        <h2 className="pb-3 mt-4 mb-3 border-bottom">Your Accounts</h2>
        <ListGroup>{!isLoading && renderAccountsList(accounts)}</ListGroup>
      </div>
    )
  }

  return (
    <div className="Home">
      {isAuthenticated ? renderAccounts() : renderLander()}
    </div>
  )
}

// import React, { Component } from "react";
// import { Link } from "react-router-dom";
// import { ListGroup, ListGroupItem } from "react-bootstrap";
// import "./Home.css";

// export default class Home extends Component {
//   constructor(props) {
//     super(props);

//     this.state = {
//       isLoading: true
//     };
//   }

//   async componentDidMount() {
//     if (!this.props.isAuthenticated) {
//       return;
//     }

//     try {
//     } catch (e) {
//       alert(e);
//     }

//     this.setState({ isLoading: false });
//   }

//   lineFormatter = (transAcc, account) => {
//     let line = "Balance: "
//     if (transAcc) {
//       let lineAcc = transAcc.find(x => x.accountId === account.accountId)
//       if (lineAcc) {
//         line += (parseInt(lineAcc.currentBal, 10) / 100).toFixed(2)
//         if (lineAcc.interest) {
//           if (lineAcc.currentCrRate > 0)
//             line += ', Credit Rate: ' + (lineAcc.currentCrRate).toFixed(2) + "%"
//           if (lineAcc.currentDbRate > 0)
//             line += ', Debit Rate: ' + (lineAcc.currentDbRate).toFixed(2) + "%"
//         }
//       }
//     }
//     return line
//   }

//   handleAccountClick = event => {
//     event.preventDefault();
//     this.props.history.push(event.currentTarget.getAttribute("href"));
//   }

//   renderAccountsList(accounts, transAcc) {
//     let acclist = [{}]
//     if (accounts) acclist = acclist.concat(accounts)
//     return acclist.map(
//       (account, i) =>
//         i !== 0
//           ? <div className="row" key={account.accountId}>
//                 <ListGroupItem
//                   key={account.accountId}
//                   href={`/accounts/${account.accountId}`}
//                   onClick={this.handleAccountClick}
//                   header={account.description.trim().split("\n")[0]}
//                 >
//                   {this.lineFormatter(transAcc,account)}
//                 </ListGroupItem>
//               </div>
//           : <div className="row" key="new">
//                 <ListGroupItem key="new" href="/accounts/new" onClick={this.handleAccountClick}>
//                   <h4>
//                     <b>{"\uFF0B"}</b> Create a new account
//                   </h4>
//                 </ListGroupItem>
//             </div>
//     );
//   }

//   renderLander() {
//     return (
//       <div className="lander">
//         <h1>Lydia</h1>
//         <p>Take control of your money</p>
//         <div>
//           <Link to="/login" className="btn btn-info btn-lg">
//             Login
//           </Link>
//           <Link to="/signup" className="btn btn-success btn-lg">
//             Signup
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   renderAccounts() {
//     return (
//       <div className="accounts">
//         <h1>Your Accounts</h1>
//         <ListGroup>
//           {!this.state.isLoading && this.renderAccountsList(this.props.accounts, this.props.transAcc)}
//         </ListGroup>
//       </div>
//     );
//   }

//   render() {
//     return (
//       <div className="Home">
//         {this.props.isAuthenticated ? this.renderAccounts() : this.renderLander()}
//       </div>
//     );
//   }
// }
