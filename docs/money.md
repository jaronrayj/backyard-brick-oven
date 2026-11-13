# Money (Profit First)

`/money` (admins) works out the Profit First transfers from the wrap-ups in the
money tracker. The site never touches the bank: the transfers are made by hand
in the America First app, then **Mark as moved** records them.

| Piece | Where |
| --- | --- |
| Page | `src/pages/Money/` |
| Server | `functions/money.js` (`moneyToMove`, `markMoneyMoved`, `runMoneyDay`) |
| Math and tests | `functions/moneyMath.js`, `functions/moneyMath.test.js` |
| Percentages and start date | Firestore `eventSettings/money` (the page edits `splits`) |
| What's been moved | `moneyCounted/state` and `moneyMoves/` (server only) |

## How it adds up

- **Money in** is Venmo + cash + SimpleSwipe from each wrap-up row in Form
  Responses. Tips are left out (they're the staff's).
- **Pizza:** ingredients come off first (15% to start, from the 120-pizza batch
  cost and the Pizza pricing sheet). The rest is real revenue, split into
  Profit, Owner's Pay and Tax; Operating expenses get what's left.
- **ENB:** event names starting with "ENB" use their own split, Owner's Pay
  and Tax only.
- Ingredients and operating expenses stay in checking, where the autopays come
  from. Only Profit, Owner's Pay and Tax are transfers.

Starting percentages (edit them on the page):

| | Ingredients | Profit | Owner's Pay | Tax | Operating |
| --- | --- | --- | --- | --- | --- |
| Pizza | 15% | 2% | 30% | 15% | the rest |
| ENB | 0% | 0% | 85% | 15% | the rest |

The Relay target for under $250K of real revenue is 5 / 50 / 15 / 30; raise
the percentages toward it a little each quarter.

## Not counting twice

Each wrap-up row is known by its form timestamp, which edits don't change.
**Mark as moved** records how much of each row was moved. If a wrap-up is
edited later to add money, only the extra shows up next time. If new money
comes in between opening the page and marking it, nothing is recorded and the
page shows the new amounts. Wrap-ups before `startDate` (Nov 1, 2026) aren't
counted.

## Reminder

On the 10th and 25th, after the morning summary time, a notification lists the
transfers and opens `/money` (run by `notificationTimer`; once a day, and only
when there's money waiting).
