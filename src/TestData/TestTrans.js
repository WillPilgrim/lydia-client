import Moment from "moment";

export const testTransactions = [
  {
    // Main - General purpose
    accountId: "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7",
    interestStartDate: Moment("2018-06-01").format(),
    openingInterest: 5835,
    minimise: 'Y',
    minBalance: 10000,
    minimisePartner: "58749090-7adf-11e8-a000-cfaf666b12b9",
    minStartDate: Moment("2018-01-15").format(),
    minEndDate: Moment("2025-09-15").format(),
    minPeriodType: 'M',
    minPeriodCnt: 1,
    trans: [
      {
        transactionId: 1,
        date: Moment("2018-06-01").format(),
        description: "Salary",
        crAmount: 100000,
        dbAmount: 0,
        autogen: Moment("2018-06-01").format()
      },
      {
        transactionId: 2,
        date: Moment("2018-06-02").format(),
        description: "Petrol",
        crAmount: 0,
        dbAmount: 3500,
        autogen: Moment("2018-06-01").format()
      },
      {
        transactionId: 3,
        date: Moment("2018-06-03").format(),
        description: "Groceries",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment("2018-06-01").format()
      },
      {
        transactionId: 4,
        date: Moment("2010-06-03").format(),
        description: "First transaction",
        crAmount: 100,
        dbAmount: 0,
        autogen: Moment("2010-06-01").format()
      },
      {
        transactionId: 5,
        date: Moment("2029-06-03").format(),
        description: "Future trans",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment("2029-06-03").format()
      },
      {
        transactionId: 6,
        date: Moment().subtract(1, 'd').format(),
        description: "Yesterday",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment().subtract(1, 'd').format()
      },
      {
        transactionId: 7,
        date: Moment().format(),
        description: "Today",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment().format()
      },
      {
        transactionId: 8,
        date: Moment().add(1, 'd').format(),
        description: "Tomorrow auto",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment().add(1, 'd').format()
      },
      {
        transactionId: 98,
        date: Moment().add(1, 'd').format(),
        description: "Tomorrow Manual",
        crAmount: 0,
        dbAmount: 9999,
      },
      {
        transactionId: 9,
        date: Moment().add(1, 'y').format(),
        description: "Manual one year hence",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment("0001-01-01").format()
      }
    ]
  },
  {
    // Holiday - Holiday savings
    accountId: "a9ca4f40-73d0-11e8-8ec0-3fce1802dff7",
    interestStartDate: Moment("2018-06-01").format(),
    openingInterest: 0,
    type: 'interest',
    endDate: Moment("2025-01-01").format(),
    intPeriodType: 'M',
    intPeriodCnt: 1,
    close: 'Y',
    closePartner: 'c8c74b80-7adf-11e8-a000-cfaf666b12b9',
    closeDate: Moment("2025-12-31").format(),
    trans: [
      {
        transactionId: 12,
        date: Moment("2020-06-15").format(),
        description: "Future auto trans",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment("2020-06-15").format()
      },
      {
        transactionId: 11,
        date: Moment("2018-06-15").format(),
        description: "Repairs",
        crAmount: 0,
        dbAmount: 10550,
        autogen: Moment("2018-06-15").format()
      }
    ]
  },
  {
    // Mastercard - Bankwest Mastercard
    accountId: "3f42a830-79d8-11e8-8888-85e7b8290a9c",
    interestStartDate: Moment("2018-06-01").format(),
    openingInterest: 0,
    type: 'cc',
    endDate: Moment("2025-01-01").format(),
    ccPeriodType: 'M',
    ccPeriodCnt: 1,
    ccDates: [],
    payDay: 9,
    periodEndDay: 28,
    payFromAccId: "ae29b1c0-73d0-11e8-8ec0-3fce1802dff7",
    trans: [
      {
        transactionId: 12,
        date: Moment("2020-06-15").format(),
        description: "Past trans auto",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment("2020-06-15").format()
      },
      {
        transactionId: 11,
        date: Moment("2018-06-15").format(),
        description: "Night out",
        crAmount: 0,
        dbAmount: 15000,
        autogen: Moment("2018-06-15").format()
      }
    ]
  },
  {
    // Savings - Long term savings
    accountId: "58749090-7adf-11e8-a000-cfaf666b12b9",
    interestStartDate: Moment("2018-06-01").format(),
    openingInterest: 0,
    type: 'interest',
    endDate: Moment("2025-01-01").format(),
    intPeriodType: 'M',
    intPeriodCnt: 1,
    trans: []
  }
];