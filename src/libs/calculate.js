import Moment from "moment";
import { uuid } from './utilities';

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
    let inflate = true;   // hardcode for now...use tr.inflate eventually
    let startDate = Moment(tr.startDate);
    let sd = Moment(startDate);
    let ed = Moment(tr.endDate);
    while (sd.isSameOrBefore(ed)) {
      let amount = tr.amount;
      let newTrans = { date: sd.format(), description: tr.description, autogen: sd.format(), transactionId: uuid() };
      let account = transactions.find(x => x.accountId === tr.accountFromId);
      if (sd > Moment()) {
        if (inflate) {
          let numYears = sd.diff(startDate, 'years');
          if (numYears < 0)
            numYears = 0;
          amount = Math.floor(amount * Math.pow((1 + inflation), numYears));
        }
        if (tr.templateType === "Debit") {
          newTrans.dbAmount = amount;
          newTrans.crAmount = 0;
        } else {
          newTrans.crAmount = amount;
          newTrans.dbAmount = 0;
        }
        account.trans.push(newTrans);
        account.dirty = true;
      }
      sd = sd.add(tr.periodCnt, tr.periodType);
    }
  });
  // 	var partner = trans_templates[i].partner;
  // 	var basedate = trans_templates[i].basedate;
  // 	var baseamt = trans_templates[i].amount;
  // 	var dayOffs = trans_templates[i].dayOffs;
  // 	var partnerdesc = trans_templates[i].part_desc;

  // 	var amount=0;
  // 	while (startDate <= endDate)
  // 	{
  // 		var line;
  // 		if (startDate > toDay)
  // 		{
  // 			if (basedate === undefined)
  // 			{
  // 				amount = baseamt;
  // 			}
  // 			else
  // 			{
  // 				var numyears = dateDiffInYears(basedate,startDate);
  // 				if (numyears < 0)
  // 				{
  // 					numyears = 0;
  // 				}
  // 				amount = Math.round(100 * baseamt * Math.pow((1 + inflation),numyears)) / 100;
  // 			}
  // 			line = {date: startDate, item: description, autogen: startDate};
  // 			if (amount < 0) {
  // 				line.income = -amount;
  // 			} else {
  // 				line.expense = amount;
  // 			}
  // 			data[acc].push(line);
  // 			accounts[acc].dirty = true;

  // 			if (partner != undefined)
  // 			{
  // 				var partnerdate;
  // 				if (dayOffs === undefined)
  // 				{
  // 						partnerdate = startDate;
  // 				} else {
  // 						partnerdate = startDate = DateAdd("daily",dayOffs,startDate);
  // 				}
  // 				var desc = description;
  // 				if (partnerdesc != undefined)
  // 				{
  // 					desc = partnerdesc;
  // 				}
  // 				line = {date: partnerdate, item: desc, autogen: partnerdate};
  // 				if (amount < 0) {
  // 					line.expense = -amount;
  // 				} else {
  // 					line.income = amount;
  // 				}
  // 				data[partner].push(line);
  // 				accounts[partner].dirty = true;
  // 			}
  // 		}

  // 		startDate = DateAdd(period_type,period_count,startDate);
  // 	}
  // }
};

let processSpecials = (transactions, templates) => {
};

let updateBalances = (transactions) => {
//	Sort each account and update balances
  transactions.forEach(account => updateBalance(account));
};

let updateBalance = (account) => {
  //	Sort given account and update balances
  
    if (account.dirty) {
      account.trans.sort( (a,b) => Moment(a.date).valueOf() - Moment(b.date).valueOf() );
      let bal = account.openingBal;
      let rate = account.openingRate;
      let interestStartDate = account.interestStartDate;
      let totalInterest = account.openingInterest;
      let prevDate = interestStartDate;
      let numRows = account.trans.length;
      let inc;
      let exp;
      let description;
      let currentBal = bal;
      let lowestBal = 0;
      if (Moment(account.openingDate).isAfter(Moment())) 
        currentBal = 0;


      var pay_date;
      var ccindex = -1;
      var ccbal = bal;
      var prev = -1;
      var savebal;
      var saverate;
      var savetotalint;
      var current_balance = bal;
      var line = {};
    	
        // if cc account, look for pay dates to calculate pay off amounts
      // if (ccdates.length > 0) {
      //   pay_date = ccdates[0];
      //   ccindex = 0;
      // }
//      account.trans.forEach(tr => {
        for (let tr of account.trans) {


//        var line_date = data[accno][i].date;
//        var trans_type = data[accno][i].type;

        /*
  
        // Credit card payment calculation
        if (ccindex > -1) {
          if (line_date > pay_date) {
            ccbal = bal;
            ccindex = ccindex + 1;
            pay_date = ccdates[ccindex];
          }
        	
          // Check if this line is a credit card line
          if (trans_type == "cc") {
            if (line_date > toDay)
            {
              data[accno][i].income = -ccbal;
            	
              line = {date: line_date, autogen: line_date,expense: -ccbal,item:"To " + accounts[accno].desc + " for credit card pay off"};
              data[partner].push(line);
              accounts[partner].dirty = true;
            }
          }
        }

        */

        /*
  
        // Zero account to/from partner (if provided)
        if (line_date > toDay) {
          if (trans_type == "zero") {
            line_date = data[accno][i].date;
            line = {date: line_date, autogen: line_date};
            if (bal >= 0) {
              data[accno][i].expense = bal;
              description = "Withdrawal to clear balance";
            } else {
              data[accno][i].income = -transferamt;
              description = "Deposit to clear balance";
            }
            if (partner > -1) {
              if (bal < 0) {
                description = "From " +accounts[partner].desc + " to clear balance";
                line.expense = -bal;
                line.item = "To " + accounts[accno].desc;
              } else {
                description = "To " +accounts[partner].desc + " to clear balance";
                line.income = bal;
                line.item = "From " + accounts[accno].desc;
              }
              data[partner].push(line);
              accounts[partner].dirty = true;
            }
            data[accno][i].item = description;
          }
        }
  
        */

        /*

        // minimise types calculation process
        if (line_date > toDay) {
          if  (trans_type == "minimise" || trans_type == "period_end_marker") {
            if (prev == -1) {
              prev = i;
              lowestbal = bal;	// initial lowest balance of period
              savebal = bal;  	// remember balance at this point
              saverate = rate;	// remember rate at this point
              savetotalint = total_interest; // remember total interest at this point
            } else {
              if (trans_type == "period_end_marker") {
                var temparr = data[accno];
                data[accno].splice(i,1);
                numrows = data[accno].length;	// set reduced length for loop
              }
              i = prev;  // set loop back to previous minimise line
              line_date = data[accno][i].date;
              var transferamt = -Math.floor((lowestbal - minbal) / 10) * 10;
              // partner line
              line = {date: line_date, autogen: line_date};
              if (transferamt >= 0) {
                data[accno][i].income = transferamt;
                description = "Deposit to ensure minimum balance";
              } else {
                data[accno][i].expense = -transferamt;
                description = "Withdrawal to ensure minimum balance";
              }
              if (partner > -1) {
                if (transferamt >= 0) {
                  description = "From " +accounts[partner].desc + " to ensure minimum balance";
                  line.income = transferamt;
                  line.item = "To " + accounts[accno].desc;
                } else {
                  description = "To " +accounts[partner].desc + " to ensure minimum balance";
                  line.income = -transferamt;
                  line.item = "From " + accounts[accno].desc;
                }
                data[partner].push(line);
                accounts[partner].dirty = true;
              }
              data[accno][i].item = description;
  
              bal = savebal;  // restore balance to this point
              rate = saverate; // restore rate at this point
              total_interest = savetotalint; // restore total interest at this point
              prev = -1; // reset start of minimise entry
            }
          }
        }

        */

        /*
      	
        if (rate != undefined)  // interest rate calculations
        {
          if (line_date >= interest_start_date)
          {
            // calculate 'line interest' which is the interest calculated since the last line entry
            var days_diff = dateDiffInDays(prev_date,line_date);
            prev_date = line_date;
            var line_interest = bal * Math.pow((1 + rate/365.25),days_diff) - bal;
            total_interest = total_interest + line_interest;
            data[accno][i].interest = line_interest;
          	
            // Add accumulated interest between interest debit/credit entries
            if (trans_type == "interest")
            {
              if (line_date > toDay)
              {
                if (total_interest >= 0) {
                  data[accno][i].income = total_interest;
                  description = "Interest Credit";
                } else {
                  data[accno][i].expense = -total_interest;
                  description = "Interest Debit";
                }
                data[accno][i].item = description;
              }
              total_interest = 0;
            }
          }
        	
          //  get current rate from rate change entry
          if (data[accno][i].new_rate != undefined)
          {
            rate = data[accno][i].new_rate;
            if (line_date <= toDay) {
              accounts[accno].current_rate = rate;
            }
          }
        	
        }
        
        */

        bal += (tr.crAmount - tr.dbAmount);           // update line running balance
        tr.balance = bal;
        
        if (bal < lowestBal)                          // check lowest balance of period
          lowestBal = tr.balance;
        
        if (Moment(tr.date).isSameOrBefore(Moment())) // Update today's running balance
          currentBal = tr.balance;
      };
    	

      account.currentBal = currentBal;
      account.dirty = false;
    }
  
};