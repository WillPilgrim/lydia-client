#Special transaction types

- Minimise and Zero

The 'minimise' transaction type is an attribute of an account. Basically it allows an account to set a minimum value the account can get to within a period.
If the balance of the account would fall below that value, funds are transferred from a partner account at the start of the period to ensure this doesn't happen. 
Conversely if the minimum balance for the period is above the set value, funds are transferred to the partner account.

Note optionally a transfer from a partner account can be limited to ensure that account's balance does not go negative.

Example 1:

A Cheque account has a 'minimise' facility set to the 1st of every month with a value of $100, with a 'partner' Savings account. If, for example, the minimum balance for the month falls on the 10th of the month and is $30, then an automatic transfer would be set from the Savings to the Cheque account on the 1st of that month of $70. 

Example 2:
Imagine the same scenario as for example 1, but with the limit option set preventing the Savings account's balance go negative. If the balance of the Savings is only $50, then only $50 will be transferred to the Cheque account.

Example 3:
Imagine the same scenario again except the minimum balance is $300. Then an automatic transfer would be generated of $200 from the Cheque to the Savings account.

The Zero transaction type is a special case of the minimise type. There is only ever one on an account and it represents a closing transaction that sets the balance to 0. That is, funds are transferred from or to a partner account that ensures that on the closing date, the account is cleared.

Restrictions
============
- Only one Zero attribute per account. This reflects the idea that an account is only closed once.
- One Minimise attribute per account. This reflects that an account can only minimise to one partner account.
- Minimise and Zero attributes cannot be applied to Credit Card accounts. This is because the 'Payoff' attribute for Credit Card transactions is a special type of Minimise attribute and would create conflicts.
- Accounts can cascade Minimise and Zero attributes provided this does not create a dependency loop. For example, account A, B and C all minimise to $100. A uses funds from B, B uses funds from C, and C uses funds from A. This cannot be resolved and is not permitted.
