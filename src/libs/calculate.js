import Moment from "moment";

export default (transactions, template) => {
  // 1. Remove future transactions
  delfuture(transactions);
  // 2. Process normal template transactions
  let currTrans = processNormal(transactions, template);
  return currTrans;
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
  templates.forEach(tr => {
    let sd = Moment(tr.startDate);
    let ed = Moment(tr.endDate);
    while (sd.isSameOrBefore(ed)) {
      let amount = tr.amount;
      let newTrans = { date: sd.format(), description: tr.description, autogen: sd.format(), transactionId: uuid()};
      let account = transactions.find(x => x.accountId === tr.accountFromId);
      if (sd > Moment()) {
        // handle inflation here....
        if (tr.templateType === "Debit") {
          newTrans.dbAmount = amount;
          newTrans.crAmount = "";
        } else {
          newTrans.crAmount = amount;
          newTrans.dbAmount = "";
        }
        account.trans.push(newTrans);
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
  return transactions;
};

let uuid = () => {
  let dt = new Date().getTime();
  let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = (dt + Math.random()*16)%16 | 0;
      dt = Math.floor(dt/16);
      return (c=='x' ? r :(r&0x3|0x8)).toString(16);
  });
  return uuid;
}
