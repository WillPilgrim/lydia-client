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
    // Initialise work variables
    account.dirty = false;
    account.currentBal = 0;
    account.currentCrRate = 0;
    account.currentDbRate = 0;
  });
};

let processNormal = (transactions, templates) => {
  // Hardcode inflation rate for now

  const inflation = 0.03;

  templates.forEach(template => {
    let inflate = true; // hardcode for now...use template.inflate eventually
    let startDate = Moment(template.startDate);
    let transDate = Moment(startDate);
    let endDate = Moment(template.endDate);
    let account = transactions.find(
      acc => acc.accountId === template.accountFromId
    );
    let accountTo = transactions.find(
      acc => acc.accountId === template.accountToId
    );

    while (transDate.isSameOrBefore(endDate, "day")) {
      if (transDate.isAfter(Moment(), "day")) {
        let amount = template.amount;
        if (inflate) {
          let numYears = transDate.diff(startDate, "years");
          if (numYears < 0) numYears = 0;
          amount = Math.floor(amount * Math.pow(1 + inflation, numYears));
        }

        let dbAmount = 0;
        let crAmount = 0;
        if (
          template.templateType === "Debit" ||
          template.templateType === "Transfer"
        )
          dbAmount = amount;
        else crAmount = amount;

        let newTrans = {
          date: transDate.format(),
          description: template.description,
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
          if (template.dayOffs)
            partnerDate = partnerDate.add(template.dayOffs, "d");
          let partnerDesc = template.description;
          if (template.partnerDesc) partnerDesc = template.partnerDesc;
          accountTo.trans.push({
            date: partnerDate.format(),
            description: partnerDesc,
            autogen: partnerDate.format(),
            transactionId: uuid(),
            dbAmount: crAmount,
            crAmount: dbAmount
          });
          accountTo.dirty = true;
        }
      }
      transDate = transDate.add(template.periodCnt, template.periodType);
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
    let periodType = account.ccPeriodType;
		let periodCnt = account.ccPeriodCnt;
		let payFromAccount = transactions.find(
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
          description: `Payment from ${payFromAccount.accName}`,
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
      let periodType = account.intPeriodType;
      let periodCnt = account.intPeriodCnt;

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
      updateBalance(account, transactions);
    });

  // 3. Process dynamic transfer template types
  let specials = [];
  transactions.forEach(account => {
    if (account.close)
      specials.push({
        type: "close",
        active: true,
        accountId: account.accountId,
        partner: account.closePartner,
        startDate: Moment(account.closeDate)
      });
    if (account.minimise)
      specials.push({
        type: "minimise",
        active: true,
        accountId: account.accountId,
        partner: account.minimisePartner,
        startDate: account.minStartDate,
        endDate: account.minEndDate,
        periodType: account.minPeriodType,
        periodCnt: account.minPeriodCnt
      });
  });

  let completed = 0;
  while (completed < specials.length) {
    specials.filter(special => special.active).forEach(special => {
      let accId = special.accountId;

      // Only process this special if no active account minimises to this one
      if (
        !specials.find(special => special.partner === accId && special.active)
      ) {
        let startDate = Moment(special.startDate);
        let endDate = Moment(special.endDate);
        let account = transactions.find(acc => acc.accountId === accId);
        let periodType = special.periodType;
        let periodCnt = special.periodCnt;
        let specialType = special.type;
        let insertEndMarker = false;

        switch (specialType) {
          case "minimise":
            while (startDate.isSameOrBefore(endDate, "day")) {
              if (startDate.isAfter(Moment(), "day")) {
                account.trans.push({
                  date: startDate.format(),
                  autogen: startDate.format(),
                  transactionId: uuid(),
                  dbAmount: 0,
                  crAmount: 0,
                  type: specialType
                });
                account.dirty = true;
                insertEndMarker = true;
              }
              startDate = startDate.add(periodCnt, periodType);
            }
            break;
          case "close":
            if (startDate.isAfter(Moment(), "day")) {
              account.trans.push({
                date: startDate.format(),
                autogen: startDate.format(),
                transactionId: uuid(),
                dbAmount: 0,
                crAmount: 0,
                type: specialType
              });
              account.dirty = true;
            }
            break;
          default:
            break;
        }

        if (insertEndMarker) {
          account.trans.push({
            date: startDate.format(),
            autogen: startDate.format(),
            transactionId: uuid(),
            dbAmount: 0,
            crAmount: 0,
            type: "periodEndMarker"
          });
        }

        updateBalance(account, transactions); // ensure account ready to process

        completed++;
        specials.active = false;
      }
    });
  }
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
    let dbRate = account.dbRate/100;
    let crRate = account.crRate/100;
    let interestStartDate = Moment(account.interestStartDate);
    let totalInterest = account.openingInterest;
    let prevInterestDate = Moment(interestStartDate);
    let accType = account.type;
    let currentBal = bal;
    let lowestBal = 0;
    let periodEndDate;
    let ccIndex = -1;
    let ccBalance = bal;
    let minPeriodStartIndex = -1;
    let saveBal;
    let saveCrRate;
    let saveDbRate;
    let saveTotalInt;

    if (Moment(account.openingDate).isAfter(Moment(), "day")) currentBal = 0;

    // Initialise first closing balance date for credit card accounts
    let ccPartnerAcc;
    if (account.ccDates) {
      ccPartnerAcc = transactions.find(
        acc => acc.accountId === account.payFromAccId
      );
      periodEndDate = Moment(account.ccDates[0]);
      ccIndex = 0;
    }

    // Initialise minimising partner account
    let minPartnerAcc;
    if (account.minimisePartner) {
      minPartnerAcc = transactions.find(
        acc => acc.accountId === account.minimisePartner
      );
    }

    // Initialise closing partner account
    let closePartnerAcc;
    if (account.closePartner) {
      closePartnerAcc = transactions.find(
        acc => acc.accountId === account.closePartner
      );
    }

    //    for (let tr of account.trans) {

    // Use an old school loop so it can be manipulated when
    // doing 'minimise' transactions
    for (let trIndex = 0; trIndex < account.trans.length; trIndex++) {
      let tr = account.trans[trIndex];

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

              if (ccPartnerAcc) {
                ccPartnerAcc.trans.push({
                  date: lineDate.format(),
                  autogen: lineDate.format(),
                  transactionId: uuid(),
                  dbAmount: -ccBalance,
                  crAmount: 0,
                  description: `To ${account.accName} for credit card payment`
                });
                ccPartnerAcc.dirty = true;
              }
            }
          }
        }
      }

      if (lineDate.isAfter(Moment(), "day")) {
        // Close account to/from partner (if provided)
        if (tr.type === "close") {
          if (bal >= 0) {
            tr.crAmount = 0;
            tr.dbAmount = bal;
            tr.description = "Withdrawal to clear balance";
          } else {
            tr.dbAmount = 0;
            tr.crAmount = -bal;
            tr.description = "Deposit to clear balance";
          }

          if (closePartnerAcc) {
            let newTrans = {
              date: tr.date,
              autogen: tr.date,
              transactionId: uuid(),
              dbAmount: 0,
              crAmount: 0
            };
            if (bal < 0) {
              tr.description = `From ${
                closePartnerAcc.accName
                } to clear balance`;
              newTrans.dbAmount = -bal;
              newTrans.description = `To ${account.accName}`;
            } else {
              tr.description = `To ${
                closePartnerAcc.accName
                } to clear balance`;
              newTrans.crAmount = bal;
              newTrans.description = `From ${account.accName}`;
            }
            closePartnerAcc.trans.push(newTrans);
            closePartnerAcc.dirty = true;
          }
        }

        // minimise types calculation process
        if (tr.type === "minimise" || tr.type === "periodEndMarker") {
          if (minPeriodStartIndex === -1) {
            // starting a new min period
            minPeriodStartIndex = trIndex;
            lowestBal = bal; // initial balance is the lowest for period so far
            saveBal = bal; // remember current balance when we return here
            saveCrRate = crRate;
            saveDbRate = dbRate;
            saveTotalInt = totalInterest;
          } else {
            // remove final minimise end of period marker
            if (tr.type === "periodEndMarker") account.trans.splice(trIndex, 1);
            trIndex = minPeriodStartIndex; // go back to the beginning of the period
            tr = account.trans[trIndex];
            // Calculate amount to transfer out of account rounded down to 10
            let transferAmt =
              Math.floor((lowestBal - account.minBalance) / 10) * 10;
            if (transferAmt >= 0) {
              tr.crAmount = 0;
              tr.dbAmount = transferAmt;
              tr.description =
                "Withdrawal of excess funds above minimum balance";
            } else {
              tr.dbAmount = 0;
              tr.crAmount = -transferAmt;
              tr.description = "Deposit to ensure minimum balance";
            }

            if (minPartnerAcc) {
              let newTrans = {
                date: tr.date,
                autogen: tr.date,
                transactionId: uuid(),
                dbAmount: 0,
                crAmount: 0
              };
              if (transferAmt < 0) {
                tr.description = `From ${
                  minPartnerAcc.accName
                  } to ensure minimum balance`;
                newTrans.dbAmount = -transferAmt;
                newTrans.description = `To ${account.accName}`;
              } else {
                tr.description = `Excess funds above minimum to ${
                  minPartnerAcc.accName
                  }`;
                newTrans.crAmount = transferAmt;
                newTrans.description = `From ${account.accName}`;
              }
              minPartnerAcc.trans.push(newTrans);
              minPartnerAcc.dirty = true;
            }

            bal = saveBal; // restore balance, rate and interest to start of period
            dbRate = saveDbRate;
            crRate = saveCrRate;
            totalInterest = saveTotalInt;
            minPeriodStartIndex = -1; // start looking for a new period
          }
        }
      }

      // interest rate calculations
      if (accType === "interest") {
        if (lineDate.isSameOrAfter(interestStartDate, "day")) {
          // calculate 'line interest' which is the interest calculated since the last line entry
          let daysDiff = lineDate.diff(prevInterestDate, "days");
          prevInterestDate = Moment(lineDate);
          let lineInterest = bal * Math.pow(1 + (bal > 0 ? crRate: dbRate) / 365.25, daysDiff) - bal;
          totalInterest += lineInterest;
          tr.interest = lineInterest;

          // Add accumulated interest between interest debit/credit entries
          if (tr.type === "interest") {
            if (lineDate.isAfter(Moment(), "day")) {
              totalInterest = Math.floor(totalInterest);
              if (totalInterest >= 0) {
								tr.dbAmount = 0;
                tr.crAmount = totalInterest;
                tr.description = "Interest Credit";
              } else {
								tr.crAmount = 0;
                tr.dbAmount = -totalInterest;
                tr.description = "Interest Debit";
              }
            }
            totalInterest = 0;
          }
        }

        //  Get current rate from rate change entry
        if (tr.newRate !== undefined) {
          if (tr.credit) crRate = tr.newRate;
          else dbRate = tr.newRate;
          if (lineDate.isSameOrBefore(Moment(), "day"))
            account.currentCrRate = crRate;
            account.currentDbRate = dbRate;
        }
      }
      bal += tr.crAmount - tr.dbAmount; // update line running balance
      tr.balance = bal;

      // check lowest balance of 'minimise' period
      if (bal < lowestBal) lowestBal = tr.balance;

      // if (account.minimise)
      // {
      // 	console.log(tr.date,trIndex,bal,lowestBal,tr.crAmount,tr.dbAmount,tr.balance)
      // }

      if (Moment(tr.date).isSameOrBefore(Moment(), "day"))
        // Update today's running balance
        currentBal = tr.balance;
    }

    account.currentBal = currentBal;
    account.dirty = false;
  }
};
