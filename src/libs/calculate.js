import Moment from "moment";
import { uuid } from "./utilities";

export default (transactions, templates) => {
  // 1. Remove future transactions
  console.time("delfuture");
  delfuture(transactions);
  console.timeEnd("delfuture");
  // 2. Process normal template transactions
  console.time("processNormal");
  processNormal(transactions, templates);
  console.timeEnd("processNormal");
  // 3. Calculate special template transactions
  console.time("processSpecials");
  processSpecials(transactions, templates);
  console.timeEnd("processSpecials");
  // 4. Update transaction balances
  console.time("updateBalances");
  updateBalances(transactions);
  console.timeEnd("updateBalances");

  return transactions;
};

let delfuture = transactions => {
  // Delete future auto transactions.
  // Not using the sorting and setting array length option. This method is order N which is very quick.
  transactions.forEach(account => {
    account.trans = account.trans.filter(
      item => !Moment(item.autogen).isAfter(Moment(), "day")
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

    while (transDate.isSameOrBefore(endDate, "day")) {
      if (transDate.isAfter(Moment(), "day")) {
        let amount = tr.amount;
        if (inflate) {
          let numYears = transDate.diff(startDate, "years");
          if (numYears < 0) numYears = 0;
          amount = Math.floor(amount * Math.pow(1 + inflation, numYears));
        }

        let dbAmount = 0;
        let crAmount = 0;
        if (tr.templateType === "Debit" || tr.templateType === "Transfer")
          dbAmount = amount;
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
  transactions.filter(account => account.type === "cc").forEach(account => {
    //Note payDay must be <= 28
    let payDay = account.payDay;
    let startDate = Moment(account.openingDate).date(payDay); // set initial date to first period on the payment date
    let transDate = Moment(startDate);
    let endDate = Moment(account.endDate);
    let periodEndDay = account.periodEndDay;
    let periodType = account.periodType;
    let periodCnt = account.periodCnt;
    let payFromAcc = transactions.find(
      acc => acc.accountId === account.payFromAccId
    );

    while (transDate.isSameOrBefore(endDate, "day")) {
      transDate = transDate.add(periodCnt, periodType);
      if (transDate.isAfter(Moment(), "day")) {
        let newTrans = {
          date: transDate.format(),
          autogen: transDate.format(),
          transactionId: uuid(),
          crAmount: 0,
          dbAmount: 0,
          description: `Payment from ${payFromAcc.accountId}`,
          type: "cc"
        };
        account.trans.push(newTrans);
        account.dirty = true;

        // calculate the date the balance of the credit card is finalised
        let periodEndDate = Moment(transDate).date(periodEndDay); // Set date to trans date with closing balance day
        if (payDay <= periodEndDay)
          periodEndDate = periodEndDate.subtract(periodCnt, periodType); // closing balance date must be in the past
        account.ccDates.push(periodEndDate); // save dates for future calculation of closing statement balances
      }
    }
    updateBalance(account, transactions);
    account.ccDates.length = 0; // clear credit card dates array
  });

  // 2. Process all interest accounts
  transactions
    .filter(account => account.type === "interest")
    .forEach(account => {
      let startDate = Moment(account.interestStartDate);
      let transDate = Moment(startDate);
      let endDate = Moment(account.endDate);
      let periodType = account.periodType;
      let periodCnt = account.periodCnt;

      while (transDate.isSameOrBefore(endDate, "day")) {
        transDate = transDate.add(periodCnt, periodType);
        if (transDate.isAfter(Moment(), "day")) {
          let newTrans = {
            date: transDate.format(),
            autogen: transDate.format(),
            transactionId: uuid(),
            crAmount: 0,
            dbAmount: 0,
            type: "interest"
          };
          account.trans.push(newTrans);
          account.dirty = true;
        }
      }
      updateBalance(account);
    });

  // 3. Process dynamic transfer template types
  let specials = [];
  transactions.forEach(account => {
    if (account.close)
      specials.push({
        type: "close",
        active: true,
        account: account.id,
        partner: account.closePartner,
        date: account.closeDate
      });
    if (account.minimise)
      specials.push({
        type: "minimise",
        active: true,
        account: account.id,
        partner: account.minimisePartner,
        date: account.minStartDate,
        periodType: account.minPeriodType,
        periodCnt: account.minPeriodCnt
      });

    let completed = 0;

    while (completed < specials.length) {
      specials.filter(special => special.active).forEach(special => {
        let dependee = special.dependee; // 'dependee' is not a word! It is meant to be the account that the transfer account is dependent on

        if (!specials.find(special => (special.dependent = dependee))) {
          //         processDynamicTransfer(i);

          var startDate = specials[index].start_date;
          var endDate = specials[index].end_date;
          var accno = specials[index].dependee;
          partner = specials[index].dependent;
          var period_type = specials[index].period_type;
          var period_count = specials[index].period_count;
          var specialType = specials[index].type;
          minbal = specials[index].minbal;
          var insert_end_marker = false;
          var line = {};

          switch (specialType) {
            case "minimise":
              while (startDate <= endDate) {
                if (startDate > toDay) {
                  line = {
                    date: startDate,
                    autogen: startDate,
                    type: specialType
                  };
                  data[accno].push(line);
                  accounts[accno].dirty = true;
                  insert_end_marker = true;
                }
                startDate = DateAdd(period_type, period_count, startDate);
              }
              break;
            case "zero":
              if (startDate > toDay) {
                line = {
                  date: startDate,
                  autogen: startDate,
                  type: specialType
                };
                data[accno].push(line);
                accounts[accno].dirty = true;
              }
              break;
            default:
              break;
          }

          if (insert_end_marker) {
            data[accno].push({
              date: startDate,
              autogen: startDate,
              type: "period_end_marker"
            });
          }
          updatebalance(accno); // ensure account ready to process

          completed++;
          specials.active = false;
        }
      });
    }
  });
};

let updateBalances = transactions => {
  //	Sort each account and update balances
  transactions.forEach(account => updateBalance(account, transactions));
};

let updateBalance = (account, transactions) => {
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
    let currentBal = bal;
    let lowestBal = 0;
    let periodEndDate;
    let ccIndex = -1;
    let ccBalance = bal;
    let payFromAcc;

    if (Moment(account.openingDate).isAfter(Moment(), "day")) currentBal = 0;

    // Initialise first closing balance date for credit card accounts

    if (account.ccDates) {
      payFromAcc = transactions.find(
        acc => acc.accountId === account.payFromAccId
      );
      periodEndDate = Moment(account.ccDates[0]);
      ccIndex = 0;
    }

    for (let tr of account.trans) {
      let lineDate = Moment(tr.date);

      if (ccIndex > -1) {
        // Calculate period closing balance
        if (lineDate.isAfter(periodEndDate, "day")) {
          ccBalance = bal;
          ccIndex++;
          periodEndDate = Moment(account.ccDates[ccIndex]);
        }

        // Check if this line is a credit card payment line
        if (tr.type === "cc") {
          if (lineDate.isAfter(Moment(), "day")) {
            if (ccBalance >= 0)
              tr.description = "No credit card payment required this period";
            else {
              tr.crAmount = -ccBalance; // Insert payment amount

              let partnerTrans = {
                date: lineDate.format(),
                autogen: lineDate.format(),
                transactionId: uuid(),
                dbAmount: -ccBalance,
                crAmount: 0,
                description: `To ${account.accountId} for credit card payment`
              };
              payFromAcc.trans.push(partnerTrans);
              payFromAcc.dirty = true;
            }
          }
        }
      }

      // interest rate calculations
      if (accType === "interest") {
        if (lineDate.isSameOrAfter(interestStartDate, "day")) {
          // calculate 'line interest' which is the interest calculated since the last line entry
          let daysDiff = lineDate.diff(prevInterestDate, "days");
          prevInterestDate = Moment(lineDate);
          let lineInterest = bal * Math.pow(1 + rate / 365.25, daysDiff) - bal;
          totalInterest += lineInterest;
          tr.interest = lineInterest;

          // Add accumulated interest between interest debit/credit entries
          if (tr.type === "interest") {
            if (lineDate.isAfter(Moment(), "day")) {
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
          if (lineDate.isSameOrBefore(Moment(), "day"))
            account.currentRate = rate;
        }
      }
      bal += tr.crAmount - tr.dbAmount; // update line running balance
      tr.balance = bal;

      if (bal < lowestBal)
        // check lowest balance of period
        lowestBal = tr.balance;

      if (Moment(tr.date).isSameOrBefore(Moment(), "day"))
        // Update today's running balance
        currentBal = tr.balance;
    }

    account.currentBal = currentBal;
    account.dirty = false;
  }
};
