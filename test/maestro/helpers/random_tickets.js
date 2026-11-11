// Picks a random ticket mix that respects the app rules:
//   - at least one adult (a child ticket needs an adult)
//   - total <= 20
// The range is kept small on purpose: every ticket adds a required
// per-ticket checkbox on the Questions page, so 20 tickets would turn a
// 2-minute test into a 10-minute one. The 20-ticket cap itself is
// verified separately in max_tickets_cap.yaml.
var adult = 1 + Math.floor(Math.random() * 4); // 1-4
var child = Math.floor(Math.random() * 4);     // 0-3

var ADULT_PRICE = 30;
var CHILD_PRICE = 15;
var BOOKING_FEE_PERCENT = 10;

var adultLine = adult * ADULT_PRICE;
var childLine = child * CHILD_PRICE;
var subtotal = adultLine + childLine;
var fee = subtotal * BOOKING_FEE_PERCENT / 100;
var total = subtotal + fee;

// Regex-safe money string, e.g. 49.5 -> "49\.50" (the dot would otherwise
// match any character).
function moneyRe(value) {
  return value.toFixed(2).replace('.', '\\.');
}

output.adult = adult;
output.child = child;
output.total = adult + child;
// The app renders prices with 2 decimals and a euro sign, e.g. "49.50 €".
output.price = total.toFixed(2);
output.priceRe = moneyRe(total);
output.adultLineRe = moneyRe(adultLine);
output.childLineRe = moneyRe(childLine);
output.feeRe = moneyRe(fee);

console.log('Tickets: ' + adult + ' adult, ' + child + ' child, expected total ' + output.price + ' €');
