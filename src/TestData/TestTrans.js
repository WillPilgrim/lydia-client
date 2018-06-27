import Moment from "moment";

export const testTransactions = [
    {
      accountId: "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7",
      dirty:false,
      openingDate: Moment("2010-01-01").format(),
      openingBal: 0,
      openingRate: 0.05,
      interestStartDate: Moment("2018-06-01").format(),
      openingInterest: 5835,
      currentBal: 0,
      trans: [
        {
          transactionId: 1,
          date: Moment("2018-06-01").format(),
          description: "Salary",
          crAmount: 100000,
          dbAmount: 0,
          balance: 100000,
          autogen: Moment("2018-06-01").format()
        },
        {
          transactionId: 2,
          date: Moment("2018-06-02").format(),
          description: "Petrol",
          crAmount: 0,
          dbAmount: 3500,
          balance: 96500,
          autogen: Moment("2018-06-01").format()
        },
        {
          transactionId: 3,
          date: Moment("2018-06-03").format(),
          description: "Groceries",
          crAmount: 0,
          dbAmount: 15000,
          balance: 81500,
          autogen: Moment("2018-06-01").format()
        },
        {
            transactionId: 4,
            date: Moment("2010-06-03").format(),
            description: "First transaction",
            crAmount: 100,
            dbAmount: 0,
            balance: 81500,
            autogen: Moment("2010-06-01").format()
          },
          {
            transactionId: 5,
            date: Moment("2029-06-03").format(),
            description: "Future trans",
            crAmount: 0,
            dbAmount: 15000,
            balance: 81500,
            autogen: Moment("2029-06-03").format()
          },
          {
            transactionId: 6,
            date: Moment().subtract(1, 'd').format(),
            description: "Yesterday",
            crAmount: 0,
            dbAmount: 15000,
            balance: 81500,
            autogen: Moment().subtract(1, 'd').format()
          },
          {
            transactionId: 7,
            date: Moment().format(),
            description: "Today",
            crAmount: 0,
            dbAmount: 15000,
            balance: 81500,
            autogen: Moment().format()
          },
          {
            transactionId: 8,
            date: Moment().add(1, 'd').format(),
            description: "Tomorrow",
            crAmount: 0,
            dbAmount: 15000,
            balance: 81500,
            autogen: Moment().add(1, 'd').format()
          },
          {
            transactionId: 9,
            date: Moment().add(1, 'y').format(),
            description: "Manual one year hence",
            crAmount: 0,
            dbAmount: 15000,
            balance: 81500, 
            autogen: Moment("0001-01-01").format()
          }
        ]
    },
    {
      accountId: "a9ca4f40-73d0-11e8-8ec0-3fce1802dff7",
      dirty:false,
      openingDate: Moment("2018-06-01").format(),
      openingBal:100000,
      openingRate: 0.03,
      interestStartDate: Moment("2018-06-01").format(),
      openingInterest: 0,
      currentBal: 0,
      type: 'interest',
      endDate: Moment("2025-01-01").format(),
      interestPeriodType: 'M',
      interestPeriodCnt: 1,
      trans: [
        {
          transactionId: 12,
          date: Moment("2020-06-15").format(),
          description: "Future trans",
          crAmount: 0,
          dbAmount: 15000,
          balance: 85000,
          autogen: Moment("2020-06-15").format()
        },
        {
            transactionId: 11,
            date: Moment("2018-06-15").format(),
            description: "Night out",
            crAmount: 0,
            dbAmount: 15000,
            balance: 85000,
            autogen: Moment("2018-06-15").format()
          }
        ]
    }
  ];
