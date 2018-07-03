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
  let today = Moment();
  transactions.forEach(account => {
    account.trans = account.trans.filter(
      item => !Moment(item.autogen).isAfter(today, "day")
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
  let today = Moment();

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
      if (transDate.isAfter(today, "day")) {
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

  let today = Moment();

  transactions.filter(account => account.type === "cc").forEach(account => {
    //Note payDay must be <= 28
    let payDay = account.payDay;
    let startDate = Moment(account.openingDate).date(payDay); // set initial date to first period on the payment date
    let transDate = Moment(startDate);
    let endDate = Moment(account.closingDate);
    let periodEndDay = account.periodEndDay;
    let periodType = account.ccPeriodType;
    let periodCnt = account.ccPeriodCnt;
    let payFromAccount = transactions.find(
      acc => acc.accountId === account.payFromAccId
    );

    while (transDate.isSameOrBefore(endDate, "day")) {
      transDate = transDate.add(periodCnt, periodType);
      if (transDate.isAfter(today, "day")) {
        let newTrans = {
          date: transDate.format(),
          autogen: transDate.format(),
          transactionId: uuid(),
          crAmount: 0,
          dbAmount: 0,
          description: `Credit card payment from ${payFromAccount.accName}`,
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
  transactions.filter(account => account.calcInterest).forEach(account => {
    // First applied date is the first date an interest debit/credit entry is created for
    let startDate = Moment(account.intFirstAppliedDate);
    let transDate = Moment(startDate);
    let endDate = Moment(account.closingDate); // Create entries until the end of the account
    let periodType = account.intPeriodType;
    let periodCnt = account.intPeriodCnt;

    while (transDate.isSameOrBefore(endDate, "day")) {
      transDate = transDate.add(periodCnt, periodType);
      if (transDate.isAfter(today, "day")) {
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
    if (account.zero)
      specials.push({
        type: "zero",
        active: true,
        accountId: account.accountId,
        partner: account.zeroPartner,
        startDate: Moment(account.zeroDate)
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
              if (startDate.isAfter(today, "day")) {
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
          case "zero":
            if (startDate.isAfter(today, "day")) {
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
    // Sort all of the transactions by date
    account.trans.sort(
      (a, b) => Moment(a.date).valueOf() - Moment(b.date).valueOf()
    );

    let runningBalance = account.openingBal;
    let balanceToday = runningBalance;
    let lowestBalForPeriod = 0;
    let periodEndDate;
    let ccIndex = -1;
    let ccBalance = runningBalance;
    let minPeriodStartIndex = -1;
    let saveBal;
    let saveCrRate;
    let saveDbRate;
    let saveTotalInt;
    let today = Moment();

    if (Moment(account.openingDate).isAfter(today, "day")) balanceToday = 0;

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

    // Initialise "zero" partner account
    let zeroPartnerAcc;
    if (account.zeroPartner) {
      zeroPartnerAcc = transactions.find(
        acc => acc.accountId === account.zeroPartner
      );
    }

    //  Interest related values
    let totalInterest = 0;
    let dbRate = account.calcInterest ? account.openingDbRate / 100 : 0;
    let crRate = account.calcInterest ? account.openingCrRate / 100 : 0;
    let crRateToday = crRate;
    let dbRateToday = dbRate;

    let intFirstAppliedDate = Moment(account.intFirstAppliedDate); // Set first applied date
    // Find first date interest is to be calculated from
    let firstBaseInterestDate = intFirstAppliedDate.subtract(
      account.periodCnt,
      account.periodType
    );
    if (firstBaseInterestDate.isBefore(account.openingDate, "day"))
      firstBaseInterestDate = Moment(account.openingDate);
    let prevInterestDate = Moment(firstBaseInterestDate);

    // Use an old school loop so it can be manipulated when
    // doing 'minimise' transactions
    for (let trIndex = 0; trIndex < account.trans.length; trIndex++) {
      let tr = account.trans[trIndex];
      let lineDate = Moment(tr.date);

      if (ccIndex > -1) {
        // Calculate period closing balance
        if (lineDate.isAfter(periodEndDate, "day")) {
          ccBalance = runningBalance;
          ccIndex++;
          periodEndDate = Moment(account.ccDates[ccIndex]);
        }

        // Check if this line is a credit card payment line
        if (tr.type === "cc") {
          if (lineDate.isAfter(today, "day")) {
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

      if (lineDate.isAfter(today, "day")) {
        // Zero account to/from partner (if provided)
        if (tr.type === "zero") {
          if (runningBalance >= 0) {
            tr.crAmount = 0;
            tr.dbAmount = runningBalance;
            tr.description = "Withdrawal to clear balance";
          } else {
            tr.dbAmount = 0;
            tr.crAmount = -runningBalance;
            tr.description = "Deposit to clear balance";
          }

          if (zeroPartnerAcc) {
            let newTrans = {
              date: tr.date,
              autogen: tr.date,
              transactionId: uuid(),
              dbAmount: 0,
              crAmount: 0
            };
            if (runningBalance < 0) {
              tr.description = `From ${
                zeroPartnerAcc.accName
              } to clear balance`;
              newTrans.dbAmount = -runningBalance;
              newTrans.description = `To ${account.accName}`;
            } else {
              tr.description = `To ${zeroPartnerAcc.accName} to clear balance`;
              newTrans.crAmount = runningBalance;
              newTrans.description = `From ${account.accName}`;
            }
            zeroPartnerAcc.trans.push(newTrans);
            zeroPartnerAcc.dirty = true;
          }
        }

        // minimise types calculation process
        if (tr.type === "minimise" || tr.type === "periodEndMarker") {
          if (minPeriodStartIndex === -1) {
            // starting a new min period
            minPeriodStartIndex = trIndex;
            lowestBalForPeriod = runningBalance; // initial balance is the lowest for period so far
            saveBal = runningBalance; // remember current balance when we return here
            saveCrRate = crRate;
            saveDbRate = dbRate;
            saveTotalInt = totalInterest;
          } else {
            // remove final minimise end of period marker
            if (tr.type === "periodEndMarker") account.trans.splice(trIndex, 1);
            trIndex = minPeriodStartIndex; // go back to the beginning of the period
            tr = account.trans[trIndex];
            lineDate = Moment(tr.date);
            // Calculate amount to transfer out of account rounded down to 10
            let transferAmt =
              Math.floor((lowestBalForPeriod - account.minBalance) / 10) * 10;
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
              if (transferAmt == 0) {
                tr.description = `No excess funds available to ${minPartnerAcc.accName}`;
                newTrans.description = `No excess funds available from ${account.accName}`;
            } else {
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
              }
              minPartnerAcc.trans.push(newTrans);
              minPartnerAcc.dirty = true;
            }

            runningBalance = saveBal; // restore balance, rate and interest to start of period
            dbRate = saveDbRate;
            crRate = saveCrRate;
            totalInterest = saveTotalInt;
            minPeriodStartIndex = -1; // start looking for a new period
          }
        }
      }

      // interest rate calculations
      if (account.calcInterest) {
        if (lineDate.isAfter(firstBaseInterestDate, "day")) {
          // calculate 'line interest' which is the interest calculated since the last line entry
          let daysDiff = lineDate.diff(prevInterestDate, "days");
          prevInterestDate = Moment(lineDate);
          let lineInterest =
            runningBalance *
              Math.pow(
                1 + (runningBalance > 0 ? crRate : dbRate) / 365.25,
                daysDiff
              ) -
            runningBalance;
          totalInterest += lineInterest;
          tr.interest = lineInterest;

          // Add accumulated interest between interest debit/credit entries
          if (tr.type === "interest") {
            if (lineDate.isAfter(today, "day")) {
              totalInterest = Math.floor(totalInterest);
              tr.dbRate = dbRate;
              tr.crRate = crRate;
              if (totalInterest == 0) {
                account.trans.splice(trIndex, 1);
                trIndex--;
                tr = account.trans[trIndex];
                runningBalance = tr.balance;
                lineDate = Moment(tr.date);
              } else {
                if (totalInterest > 0) {
                  tr.dbAmount = 0;
                  tr.crAmount = totalInterest;
                  tr.description = "Interest Credit";
                } else {
                  tr.crAmount = 0;
                  tr.dbAmount = -totalInterest;
                  tr.description = "Interest Debit";
                }
              }
            } else {
              crRate = tr.crRate;
              dbRate = tr.dbRate;
            }
            totalInterest = 0;
          }
        }

        //  Get current rate from rate change entry
        if (tr.newRate !== undefined) {
          if (tr.credit) crRate = tr.newRate;
          else dbRate = tr.newRate;
        }
      }

      runningBalance += tr.crAmount - tr.dbAmount; // update line running balance
      tr.balance = runningBalance;

      // check lowest balance of 'minimise' period
      if (runningBalance < lowestBalForPeriod)
        lowestBalForPeriod = runningBalance;

      if (lineDate.isSameOrBefore(today, "day")) {
        balanceToday = runningBalance; // Update today's running balance
        crRateToday = crRate;
        dbRateToday = dbRate;
      }
    }

    // Save "current" account values as the values at end of today
    account.currentBal = balanceToday;
    account.currentCrRate = crRateToday * 100;
    account.currentDbRate = dbRateToday * 100;
    account.dirty = false;
  }
};
