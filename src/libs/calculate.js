import Moment from "moment";
import { uuid } from "./utilities";

export default (transactions, templates) => {
  // 1. Remove future transactions
  delfuture(transactions);
  // 2. Process normal template transactions
  processNormal(transactions, templates);
  // 3. Calculate special template transactions
  processSpecials(transactions, templates);
  // 4. Update transaction balances
  updateBalances(transactions);

  return transactions;
};

let delfuture = transactions => {
  // Delete future auto transactions.
  // Not using the sorting and setting array length option. This method is order N which is very quick.
  transactions.forEach(account => {
    account.trans = account.trans.filter(
      item => !Moment(item.autogen).isAfter(Moment())
    );
  });
};

let processNormal = (transactions, templates) => {
  // Hardcode inflation rate for now

  const inflation = 0.03;

  templates.forEach(tr => {
    let inflate = true; // hardcode for now...use tr.inflate eventually
    let startDate = Moment(tr.startDate);
    let transDate = Moment(startDate);
    let endDate = Moment(tr.endDate);
    let account = transactions.find(acc => acc.accountId === tr.accountFromId);
    let accountTo = transactions.find(acc => acc.accountId === tr.accountToId);

    while (transDate.isSameOrBefore(endDate)) {
      if (transDate.isAfter(Moment())) {
        let amount = tr.amount;
        if (inflate) {
          let numYears = transDate.diff(startDate, "years");
          if (numYears < 0) numYears = 0;
          amount = Math.floor(amount * Math.pow(1 + inflation, numYears));
        }

        let dbAmount = 0;
        let crAmount = 0;
        if (tr.templateType === "Debit") dbAmount = amount;
        else crAmount = amount;

        let newTrans = {
          date: transDate.format(),
          description: tr.description,
          autogen: transDate.format(),
          transactionId: uuid(),
          dbAmount: dbAmount,
          crAmount: crAmount
        };
        account.trans.push(newTrans);
        account.dirty = true;

        // Process partner account transaction
        if (accountTo) {
          // Allow for optional transfer day offset and partner description
          let partnerDate = Moment(transDate);
          if (tr.dayOffs) partnerDate = partnerDate.add(tr.dayOffs, "d");
          let partnerDesc = tr.description;
          if (tr.partnerDesc) partnerDesc = tr.partnerDesc;
          let partnerTrans = {
            date: partnerDate.format(),
            description: partnerDesc,
            autogen: partnerDate.format(),
            transactionId: uuid(),
            dbAmount: crAmount,
            crAmount: dbAmount
          };
          accountTo.trans.push(partnerTrans);
          accountTo.dirty = true;
        }
      }
      transDate = transDate.add(tr.periodCnt, tr.periodType);
    }
  });
};

let processSpecials = (transactions, templates) => {
  // 1. Process all credit card accounts

  // 2. Process all interest accounts
  transactions
    .filter(account => account.type === "interest")
    .forEach(account => {
      let startDate = Moment(account.interestStartDate);
      let transDate = Moment(startDate);
      let endDate = Moment(account.endDate);
      let periodType = account.interestPeriodType;
      let periodCnt = account.interestPeriodCnt;

      while (transDate.isSameOrBefore(endDate)) {
        transDate = transDate.add(periodCnt, periodType);
        if (transDate.isAfter(Moment())) {
          let newTrans = {
            date: transDate.format(),
            autogen: transDate.format(),
            transactionId: uuid(),
            crAmount:0,
            dbAmount:0,
            type: "interest"
          };
          account.trans.push(newTrans);
          account.dirty = true;
        }
      }

      updateBalance(account);
    });

  // 3. Process dynamic transfer template types
};

let updateBalances = transactions => {
  //	Sort each account and update balances
  transactions.forEach(account => updateBalance(account));
};

let updateBalance = account => {
  //	Sort given account and update balances

  if (account.dirty) {
    account.trans.sort(
      (a, b) => Moment(a.date).valueOf() - Moment(b.date).valueOf()
    );

    let bal = account.openingBal;
    let rate = account.openingRate;
    let interestStartDate = Moment(account.interestStartDate);
    let totalInterest = account.openingInterest;
    let prevInterestDate = Moment(interestStartDate);
    let accType = account.type;
    let inc;
    let exp;
    let currentBal = bal;
    let lowestBal = 0;

    var pay_date;
    var ccindex = -1;
    var ccbal = bal;
    var prev = -1;
    var savebal;
    var saverate;
    var savetotalint;

    if (Moment(account.openingDate).isAfter(Moment())) currentBal = 0;

    // if cc account, look for pay dates to calculate pay off amounts
    // if (ccdates.length > 0) {
    //   pay_date = ccdates[0];
    //   ccindex = 0;
    // }
    for (let tr of account.trans) {

      let lineDate = Moment(tr.date);

      // interest rate calculations
      if (accType === "interest") {
        if (lineDate.isSameOrAfter(interestStartDate)) {

          // calculate 'line interest' which is the interest calculated since the last line entry
          let daysDiff = lineDate.diff(prevInterestDate,'days');
          prevInterestDate = Moment(lineDate);
          let lineInterest = bal * Math.pow(1 + rate / 365.25, daysDiff) - bal;
          totalInterest += lineInterest;
          tr.interest = lineInterest;

          // Add accumulated interest between interest debit/credit entries
          if (tr.type === "interest") {
            if (lineDate.isAfter(Moment())) {
              totalInterest = Math.floor(totalInterest);
              if (totalInterest >= 0) {
                tr.crAmount = totalInterest;
                tr.description = "Interest Credit";
              } else {
                tr.dbAmount = -totalInterest;
                tr.description = "Interest Debit";
              }
            }
            totalInterest = 0;
          }
        }

        //  Get current rate from rate change entry
        if (tr.newRate !== undefined) {
          rate = tr.newRate;
          if (lineDate.isSameOrBefore(Moment())) 
            account.currentRate = rate;
        }
      }
      bal += tr.crAmount - tr.dbAmount; // update line running balance
      tr.balance = bal;

      if (bal < lowestBal)
        // check lowest balance of period
        lowestBal = tr.balance;

      if (Moment(tr.date).isSameOrBefore(Moment()))
        // Update today's running balance
        currentBal = tr.balance;
    }

    account.currentBal = currentBal;
    account.dirty = false;
  }
};
