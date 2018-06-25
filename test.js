var moment = require('moment');

templates = [

  { id: "2", ratingId: "3", name: "Carrot", price: "0.12" },
  { id: "3", ratingId: "2", name: "Celery", price: "1.80" }
];
ratings = [
  { id: "1", name: "Good" },
  { id: "2", name: "Average" },
  { id: "3", name: "Awful" }
];

//mf = (template) => ({ratingName:ratings.find(rating => rating.id === template.id).name,...template});
mf = ({ratingId,...remaining}) => ({ratingName:ratings.find(rating => rating.id === ratingId).name,...remaining});
//console.log(templates.map(({ratingId,...remaining}) => ({ratingName:ratings.find(rating => rating.id === ratingId).name,...remaining})));
//console.log(templates.map(({ratingId:rid,...rest}) => ({rating:ratings.find(x => x.id === rid).name,...rest})));

let accounts=[]
accounts['a9ca4f40-73d0-11e8-8ec0-3fce1802dff7'] = {userId:'ap-southeast-2:5363cdf1-ed41-42fa-90c1-3a19c18769bc',accountId:'a9ca4f40-73d0-11e8-8ec0-3fce1802dff7',content:'Savings'};
accounts['ae29b1c0-73d0-11e8-8ec0-3fce1802dff7'] = {userId:'ap-southeast-2:5363cdf1-ed41-42fa-90c1-3a19c18769bc',accountId:'ae29b1c0-73d0-11e8-8ec0-3fce1802dff7',content:'Cheque'};
accounts['8de71190-73d1-11e8-8ec0-3fce1802dff7'] = {userId:'ap-southeast-2:71097500-faa3-4d80-8139-7b4da7010f34',accountId:'8de71190-73d1-11e8-8ec0-3fce1802dff7',content:'Dev willpilgrim acc 1'};
//console.log(accounts);
//console.log(accounts[1]);
//console.log(accounts['ae29b1c0-73d0-11e8-8ec0-3fce1802dff7']);

let data = [{accountId:'Cheque',trans:
[{ transactionId:1,date:"2018-06-01",description:"Petrol",crAmount:"",dbAmount:"35.00",balance:"965.00"
}]},{
accountId:'Savings',trans:[{ transactionId:1,date:"2018-06-01",description:"Petrol",crAmount:"",dbAmount:"35.00",balance:"965.00"
}]
}];
//console.log(data[0]);
//console.log(data[1]);
//console.log(data.find(x=>x.accountId==='Cheque').trans)
let x = moment("2018-06-24").valueOf
console.log('==>',x);