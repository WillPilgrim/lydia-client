import Moment from "moment";

export const testTransactions = [
    {
      accountId: "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7",
      trans: [
        {
          transactionId: 1,
          date: "2018-06-01",
          description: "Salary",
          crAmount: "1000.00",
          dbAmount: "",
          balance: "1000.00",
          autogen: "2018-06-01"
        },
        {
          transactionId: 2,
          date: "2018-06-02",
          description: "Petrol",
          crAmount: "",
          dbAmount: "35.00",
          balance: "965.00",
          autogen: "2018-06-01"
        },
        {
          transactionId: 3,
          date: "2018-06-03",
          description: "Groceries",
          crAmount: "",
          dbAmount: "150.00",
          balance: "815.00",
          autogen: "2018-06-01"
        },
        {
            transactionId: 4,
            date: "2010-06-03",
            description: "First transaction",
            crAmount: "1.00",
            dbAmount: "",
            balance: "815.00",
            autogen: "2010-06-01"
          },
          {
            transactionId: 5,
            date: "2029-06-03",
            description: "Future trans",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: "2029-06-01"
          },
          {
            transactionId: 6,
            date: Moment().subtract(1, 'd').format("YYYY-MM-DD"),
            description: "Yesterday",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment().subtract(1, 'd').format("YYYY-MM-DD")
          },
          {
            transactionId: 7,
            date: Moment().format("YYYY-MM-DD"),
            description: "Today",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment().format("YYYY-MM-DD")
          },
          {
            transactionId: 8,
            date: Moment().add(1, 'd').format("YYYY-MM-DD"),
            description: "Tomorrow",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00",
            autogen: Moment().add(1, 'd').format("YYYY-MM-DD")
          },
          {
            transactionId: 9,
            date: Moment().add(1, 'y').format("YYYY-MM-DD"),
            description: "Manual one year hence",
            crAmount: "",
            dbAmount: "150.00",
            balance: "815.00", autogen: Moment("0001-01-01")
          }
        ]
    },
    {
      accountId: "a9ca4f40-73d0-11e8-8ec0-3fce1802dff7",
      trans: [
        {
          transactionId: 12,
          date: "2020-06-15",
          description: "Future trans",
          crAmount: "",
          dbAmount: "150.00",
          balance: "850.00",
          autogen: "2020-06-01"
        },
        {
            transactionId: 11,
            date: "2018-06-15",
            description: "Night out",
            crAmount: "",
            dbAmount: "150.00",
            balance: "850.00",
            autogen: "2018-06-01"
          }
        ]
    }
  ];
