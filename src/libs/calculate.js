import Moment from "moment";
import { uuid } from "./utilities";
import { testTransactions } from "../TestData/TestTrans";

const testData = false;
const timings = true;

export const calculate = (accounts, templates, transAcc, today ) => {
  if (timings) console.time("Recalculation Total");
  // 1. Remove future transactions
  if (timings) console.time("deleteFutureAllTransactions");
  let transactions = deleteFutureAllTransactions(accounts, transAcc, today);
  if (timings) console.timeEnd("deleteFutureAllTransactions");
  // 2. Process normal template transactions
  if (timings) console.time("processNormal");
  processNormal(transactions, templates, today);
  if (timings) console.timeEnd("processNormal");
  // 3. Calculate special template transactions
  if (timings) console.time("processSpecials");
  processSpecials(transactions, templates, today);
  if (timings) console.timeEnd("processSpecials");
  // 4. Update transaction balances
  if (timings) console.time("updateBalances");
  updateBalances(transactions, today);
  if (timings) console.timeEnd("updateBalances");
  if (timings) console.timeEnd("Recalculation Total");
  return transactions;
};

export const deleteFutureAllTransactions = (accounts, transAcc, today) =>
  accounts.map(account => {
    // ToDo: need to verify evey account in transAcc exists in accs
    let ta = transAcc.find(x => x.accountId === account.accountId); // find corresponding transAcc entry for this account
    let newTrans =[];
    if (testData) {
      let testAcc = testTransactions.find(tt => tt.accountId === account.accountId);
      if (testAcc) newTrans = testAcc.trans;
    }
    let newAccount = { trans: ta ? ta.trans : newTrans, ...account }; // Build new account from Dynamo account plus trans
    newAccount.trans = newAccount.trans.filter(
      item => !Moment(item.autogen).isAfter(today, "day")
    );
    // Initialise work variables
    newAccount.dirty = true;
    newAccount.currentBal = 0;
    newAccount.currentCrRate = 0;
    newAccount.currentDbRate = 0;
    newAccount.ccDates = [];
    return newAccount;
  });

let processNormal = (transactions, templates, today) => {
  // Hardcode inflation rate for now

  const inflation = 0.03;

  templates
    .filter(
      t =>
        t.templateType !== "CC" &&
        t.templateType !== "Minimise" &&
        t.templateType !== "Zero"
    )
    .forEach(template => {
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
            date: transDate.startOf('date').format(),
            description: template.description,
            autogen: transDate.startOf('date').format(),
            transactionId: uuid(),
            dbAmount: dbAmount,
            crAmount: crAmount,
            partnerAccId: template.accountToId,
            type: template.templateType
          };
          account.trans.push(newTrans);
          account.dirty = true;

          // Process partner account transaction
          if (accountTo) {
            // Allow for optional transfer day offset and partner description
            // Don't create partner here for "Zero" because we don't know the amount yet
            let partnerDate = Moment(transDate);
            if (template.dayOffs)
              partnerDate = partnerDate.add(template.dayOffs, "d");
            let partnerDesc = template.description;
            if (template.partnerDesc) partnerDesc = template.partnerDesc;
            accountTo.trans.push({
              date: partnerDate.startOf('date').format(),
              description: partnerDesc,
              autogen: partnerDate.startOf('date').format(),
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

let processSpecials = (transactions, templates, today) => {
  // 1. Process all credit card accounts

  templates.filter(t => t.templateType === "CC").forEach(template => {
    let account = transactions.find(
      acc => acc.accountId === template.accountFromId
    );
    account.payFromAccId = template.accountToId;
    let startDate = Moment(template.startDate);
    let transDate = Moment(startDate);
    let endDate = Moment(template.endDate);
    let payDay = startDate.get("date");
    let periodEndDay = template.periodLastDay;
    let periodType = template.periodType;
    let periodCnt = template.periodCnt;

    let payFromAccount = transactions.find(
      acc => acc.accountId === account.payFromAccId
    );

    while (transDate.isSameOrBefore(endDate, "day")) {
      transDate = transDate.add(periodCnt, periodType);
      if (transDate.isAfter(today, "day")) {
        let newTrans = {
          date: transDate.startOf('date').format(),
          autogen: transDate.startOf('date').format(),
          transactionId: uuid(),
          crAmount: 0,
          dbAmount: 0,
          description: `Credit card payment from ${payFromAccount.accName}`,
          type: template.templateType
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
  transactions.filter(account => account.interest).forEach(account => {
    // First applied date is the first date an interest debit/credit entry is created for
    let startDate = Moment(account.intFirstAppliedDate);
    let transDate = Moment(startDate);
    let endDate = Moment(account.closingDate); // Create entries until the end of the account
    let periodType = account.periodType;
    let periodCnt = account.periodCnt;

    while (transDate.isSameOrBefore(endDate, "day")) {
      if (transDate.isAfter(today, "day")) {
        let newTrans = {
          date: transDate.startOf('date').format(),
          autogen: transDate.startOf('date').format(),
          transactionId: uuid(),
          crAmount: 0,
          dbAmount: 0,
          type: "interest"
        };
        account.trans.push(newTrans);
        account.dirty = true;
      }
      transDate = transDate.add(periodCnt, periodType);
    }
    updateBalance(account, transactions);
  });

  // 3. Process dynamic transfer template types
  let specials = [];

  templates
    .filter(t => t.templateType === "Minimise" || t.templateType === "Zero")
    .forEach(template => {
      specials.push({
        active: true,
        accountId: template.accountFromId,
        partnerAccId: template.accountToId,
        startDate: template.startDate,
        endDate: template.endDate,
        periodType: template.periodType,
        periodCnt: template.periodCnt,
        type: template.templateType,
        amount: template.amount
      });
    });

  let completed = 0;
  while (completed < specials.length) {
    specials.filter(special => special.active).forEach(special => {
      let accId = special.accountId;

      // Only process this special if no active account minimises to this one
      if (
        !specials.find(
          special => special.partnerAccId === accId && special.active
        )
      ) {
        let startDate = Moment(special.startDate);
        let endDate = Moment(special.endDate);
        let account = transactions.find(acc => acc.accountId === accId);

        switch (special.type) {
          case "Minimise":
            let insertEndMarker = false;
            while (startDate.isSameOrBefore(endDate, "day")) {
              if (startDate.isAfter(today, "day")) {
                account.trans.push({
                  date: startDate.startOf('date').format(),
                  autogen: startDate.startOf('date').format(),
                  transactionId: uuid(),
                  partnerAccId: special.partnerAccId,
                  dbAmount: 0,
                  crAmount: 0,
                  minBalance: special.amount,
                  type: special.type
                });
                account.dirty = true;
                insertEndMarker = true;
              }
              startDate = startDate.add(special.periodCnt, special.periodType);
            }
            if (insertEndMarker) {
              account.trans.push({
                date: startDate.startOf('date').format(),
                autogen: startDate.startOf('date').format(),
                transactionId: uuid(),
                dbAmount: 0,
                crAmount: 0,
                type: "PeriodEndMarker"
              });
            }
            break;

          case "Zero":
            if (startDate.isAfter(today, "day")) {
              account.trans.push({
                date: startDate.startOf('date').format(),
                autogen: startDate.startOf('date').format(),
                transactionId: uuid(),
                partnerAccId: special.partnerAccId,
                dbAmount: 0,
                crAmount: 0,
                type: special.type
              });
              account.dirty = true;
            }
            break;
          default:
            break;
        }

        updateBalance(account, transactions); // ensure account ready to process

        completed++;
        specials.active = false;
      }
    });
  }
};

let updateBalances = (transactions, today) => {
  //	Sort each account and update balances
  transactions.forEach(account => updateBalance(account, transactions, today));
};

let updateBalance = (account, transactions, today) => {
  //	Sort given account and update balances
  const sortTimings = false

  if (account.dirty) {
    // Sort all of the transactions by date
    let newarray = account.trans.map(x => ({
      ...x,
      date: new Date(x.date).valueOf()
    }));
    if (sortTimings) console.time(`Sort time for ${account.accName}`);
 //   newarray.sort((a, b) => a.date - b.date);
    newarray.sort((a, b) => {
      let diff = a.date - b.date
      if (diff < 0) return -1
      if (diff > 0) return 1
      if (a.description > b.description) return 1
      return -1
    });
    if (sortTimings) console.timeEnd(`Sort time for ${account.accName}`);
    account.trans = newarray;
    account.trans.forEach(x => x.date = Moment(x.date).format('YYYY-MM-DD'))

    let runningBalance = account.amount;
    let balanceToday = runningBalance;
    if (Moment(account.openingDate).isAfter(today, "day")) balanceToday = 0;

    //  Credit card related set up
    //  ==========================

    let ccIndex = -1;
    let ccBalance = runningBalance;
    let periodEndDate;
    let ccPartnerAcc;
    if (account.ccDates.length > 0) {
      ccPartnerAcc = transactions.find(
        acc => acc.accountId === account.payFromAccId
      );
      // Initialise first closing balance date for credit card accounts
      periodEndDate = Moment(account.ccDates[0]);
      ccIndex = 0;
    }
    //  ==========================`

    //  Minimise related set up
    //  =======================
    let saveBal;
    let saveCrRate;
    let saveDbRate;
    let saveTotalInt;
    let lowestBalForPeriod = 0;
    let minPeriodStartIndex = -1;
    //  =======================

    //  Interest related set up
    //  =======================
    let totalInterest = 0;
    let dbRate = account.interest ? account.dbRate / 100 : 0;
    let crRate = account.interest ? account.crRate / 100 : 0;
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
    //  =======================

    // Use an old school loop so it can be manipulated when
    // doing 'Minimise' transactions
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
        if (tr.type === "CC") {
          if (lineDate.isAfter(today, "day")) {
            if (ccBalance >= 0)
              tr.description = "No credit card payment required this period";
            else {
              tr.crAmount = -ccBalance; // Insert payment amount

              if (ccPartnerAcc) {
                ccPartnerAcc.trans.push({
                  date: lineDate.startOf('date').format(),
                  autogen: lineDate.startOf('date').format(),
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
        if (tr.type === "Zero") {
          if (runningBalance >= 0) {
            tr.crAmount = 0;
            tr.dbAmount = runningBalance;
            tr.description = "Withdrawal to clear balance";
          } else {
            tr.dbAmount = 0;
            tr.crAmount = -runningBalance;
            tr.description = "Deposit to clear balance";
          }

          let zeroPartnerAcc = transactions.find(
            acc => acc.accountId === tr.partnerAccId
          );
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
        if (tr.type === "Minimise" || tr.type === "PeriodEndMarker") {
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
            if (tr.type === "PeriodEndMarker") account.trans.splice(trIndex, 1);
            trIndex = minPeriodStartIndex; // go back to the beginning of the period
            tr = account.trans[trIndex];
            lineDate = Moment(tr.date);
            // Calculate amount to transfer out of account rounded down to 10
            let transferAmt =
              Math.floor((lowestBalForPeriod - tr.minBalance) / 10) * 10;
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

            let minPartnerAcc = transactions.find(
              acc => acc.accountId === tr.partnerAccId
            );

            if (minPartnerAcc) {
              let newTrans = {
                date: tr.date,
                autogen: tr.date,
                transactionId: uuid(),
                dbAmount: 0,
                crAmount: 0
              };
              if (transferAmt === 0) {
                tr.description = `No excess funds available to ${
                  minPartnerAcc.accName
                }`;
                newTrans.description = `No excess funds available from ${
                  account.accName
                }`;
              } else {
                if (transferAmt < 0) {
                  tr.description = `Transfer from ${
                    minPartnerAcc.accName
                  } to ensure minimum balance`;
                  newTrans.dbAmount = -transferAmt;
                  newTrans.description = `Transfer to ${account.accName}`;
                } else {
                  tr.description = `Excess funds above minimum to ${
                    minPartnerAcc.accName
                  }`;
                  newTrans.crAmount = transferAmt;
                  newTrans.description = `Transfer from ${account.accName}`;
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
      if (account.interest) {
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
              if (totalInterest === 0) {
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

      // check lowest balance of 'Minimise' period
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
    //    console.timeEnd(`updateBalance for ${account.accName}`);
  }
};
