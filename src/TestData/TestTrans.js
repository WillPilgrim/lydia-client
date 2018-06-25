import Moment from "moment";

export const testTransactions = [
    {
      accountId: "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7",
      trans: [
        {
          transactionId: 1,
          date: Moment("2018-06-01").format(),
          description: "Salary",
          crAmount: "1000.00",
          dbAmount: "",
          balance: "1000.00",
          autogen: Moment("2018-06-01").format()
        },
        {
          transactionId: 2,
          date: Moment("2018-06-02").format(),
          description: "Petrol",
          crAmount: "",
          dbAmount: "35.00",
          balance: "965.00",
          autogen: Moment("2018-06-01").format()
        },
        {
          transactionId: 3,
          date: Moment("2018-06-03").format(),
          description: "Groceries",
          crAmount: "",
          dbAmount: "150.00",
          balance: "815.00",
          autogen: Moment("2018-06-01").format()
        },
        {
            transactionId: 4,
            date: Moment("2010-06-03").format(),
            description: "First transaction",
            crAmount: "1.00",
            dbAmount: "",
            balance: "815.00",
            autogen: Moment("2010-06-01").format()
          },
          {
            transactionId: 5,
            date: Moment("2029-06-03").format(),
            description: "Future trans",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment("2029-06-03").format()
          },
          {
            transactionId: 6,
            date: Moment().subtract(1, 'd').format(),
            description: "Yesterday",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment().subtract(1, 'd').format()
          },
          {
            transactionId: 7,
            date: Moment().format(),
            description: "Today",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment().format()
          },
          {
            transactionId: 8,
            date: Moment().add(1, 'd').format(),
            description: "Tomorrow",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment().add(1, 'd').format()
          },
          {
            transactionId: 9,
            date: Moment().add(1, 'y').format(),
            description: "Manual one year hence",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00", autogen: Moment("0001-01-01").format()
          }
        ]
    },
    {
      accountId: "a9ca4f40-73d0-11e8-8ec0-3fce1802dff7",
      trans: [
        {
          transactionId: 12,
          date: Moment("2020-06-15").format(),
          description: "Future trans",
          crAmount: "",
          dbAmount: "150.00",
          balance: "850.00",
          autogen: Moment("2020-06-15").format()
        },
        {
            transactionId: 11,
            date: Moment("2018-06-15").format(),
            description: "Night out",
            crAmount: "",
            dbAmount: "150.00",
            balance: "850.00",
            autogen: Moment("2018-06-15").format()
          }
        ]
    }
  ];
