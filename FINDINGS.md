# Findings

What exploring the app turned up, beyond what the flows assert. Severity is
my judgement from a customer's point of view: **High** = wrong order or lost
sale, **Medium** = confusing or misleading, **Low** = polish.
File references point to `lib/`.

## Booking logic

| # | Severity | Where | What happens | What I'd expect |
| --- | --- | --- | --- | --- |
| 1 | High | Date & time → Madame Tussauds | The same-day cutoff uses the **phone's** clock and time zone (`BookingState.timeslotsFor`, `DateTime.now()`). From Brno (UTC+1) slots for a New York attraction close at 9:00 NYC time; from the US west coast they stay open until 18:00 NYC time. | Availability evaluated in the attraction's time zone. |
| 2 | High | Date & time → Madame Tussauds | The cutoff is a single switch at 15:00. Before it, **slots that already passed** today are offered (at 14:00 you can buy 10:00); after it, **future slots** are closed too (16:00 can't be booked at 15:30). | Each slot judged on its own start time. |
| 3 | High | Checkout | The contact form has **no e-mail or phone**. The customer pays and gets an order code, but there is nowhere to send the tickets or the confirmation. | E-mail required (or an explicit reason it isn't). |
| 4 | High | Payment | **Every card payment is declined** (`payment_screen.dart`, with a `[QA-HINT]` in the log). The only way to Success is the promo code `MAESTROFREE`. Clearly deliberate in this build, so `purchase_flow` follows that path, but in a real build it blocks every paid order. | — |
| 5 | Medium | Date & time | The test-only tap targets that force time slots open/closed (`DebugIds`) are **not guarded by `kDebugMode`** and ship in the release APK. They are invisible 12×12 areas at the top-left of the list; a customer can hit one by accident and see "All times are closed for today". | Compiled out of release builds, or behind a flag. |
| 6 | Medium | Tickets → Checkout | The **10 % booking fee is never shown before paying.** Tickets lists 30 € / 15 € per ticket, Checkout shows only the total (2 adults: 66.00 €, not the 60 € the customer added up). The fee line first appears on Success, after the purchase. | Fee itemised before the customer pays. |
| 7 | Medium | Checkout → Questions | **Promo code UX:** the "Enter promo code" button on Checkout only shows a toast saying "Error."; the field then appears one step back on Questions; an unknown code is ignored without any message (`applyPromoCode` returns `false`). | Code entered and validated on Checkout, with feedback. |
| 8 | Medium | Checkout | **City is optional but State/Province is required** — for every country, including the pre-selected Česká republika, which has no states. The Czech label "Stát/Provincie" also reads as *country*, the field right above. The **country list has only nine entries** (Česká republika, Afghánistán, Albánie, Alžírsko, Francie, Německo, Rakousko, Slovensko, Spojené státy) — a deliberate stand-in according to the comment in `booking_state.dart`, but since Country is required, a customer from Poland, Italy or the UK can't fill the form in truthfully. | City required; state only where it applies (US, CA, AU…); the full country list, searchable. |
| 9 | Medium | Date & time | **"Reset selection" also removes an applied promo code** (`resetSelection` clears `appliedDiscount`). Unexpected on a date screen. It is also the only "reset" in the app, and it leaves everything else in place: ticket counts, the answers, the contact details and — after one payment attempt — both **ticked consent boxes** and the name on card. The prefill is deliberate (see the comment in `checkout_screen.dart`), but there is no way to start over short of finishing an order. | Reset touches only dates; a clear "start over"; consents not pre-ticked on return. |
| 10 | Low | Date & time | **Changing the first product's date silently clears** every other confirmed product (`confirmDate`). Correct rule, but no warning. | A short notice, or keep what's still valid. |
| 11 | Medium | Payment | **The card form checks only digit counts.** Expiry takes any 4 digits — month `22`, `9999`, an expired `0120` — and shows them as `2222` with no `MM/RR` separator or hint (the format only appears in the error text). The card number has no Luhn check. The **CVC is shown in plain text** while typing (no `obscureText`), unlike most payment forms. | Month 01–12 and a future date, `MM/RR` formatting as you type, Luhn check, masked CVC. |
| 12 | Low | Payment → Success | The declined screen shows an **order code**, and a successful retry ends with a **different** one. A failed payment shouldn't look like an order. | No order code until an order exists. |
| 13 | Low | Tickets | At the 20-ticket limit the **+ buttons stay active** and taps are just ignored, with no message. | Disabled + or a short hint. |
| 14 | Low | Success | "Domů" starts a fresh session and **switches the app back to Czech** even if the customer chose English. | Keep the language. |
| 15 | Low | Success | The "Order is free" badge is rendered on **every** Success screen — right today only because every successful order is free. | Shown only for free orders. |
| 16 | Low | Date & time → Statue of Liberty ferry | The button says **"Vyberte datum a čas" / "Select date and time"**, but the ferry has no time and its date is locked to the first product: one tap confirms instantly, with no dialog showing what was confirmed. The button then turns into **"Upravit" / "Edit"**, which can't change anything. (Real Statue of Liberty ferries run on timed departures — worth confirming with product that no time is intended.) | Label matching the action ("Confirm date"), and the confirmed date visible before/after. |
| 17 | Medium | Tickets → Questions | **No age ranges anywhere.** Tickets offers just "Dospělý" / "Dítě" (Adult / Child), yet Questions makes the customer tick, for every ticket, that the holder "meets the age requirement for this ticket type" — a requirement the app never states. A parent can't tell whether a 13-year-old is a child, and there is no infant ticket either, although the four attractions are unlikely to share one child age range. | Age range next to each ticket type (per product if they differ), and the confirmation referring to it. |
| 18 | Low | Questions (and other forms) | **The keyboard is hard to get rid of.** "Jak se dostavíte na místo srazu?" is a multi-line field, so the keyboard's Enter key adds a new line instead of closing it, and tapping elsewhere on the page doesn't close it either — only the system Back gesture does (no `onTapOutside` / unfocus handling anywhere in the app). When a form page comes back into view (e.g. Payment after "Try again"), focus returns to the last field and the keyboard pops up again. | Tap outside closes the keyboard; a "Done" action on the last field. |
| 19 | Low | Checkout, Questions, Payment | **Text fields only check "not empty".** First name, last name, city, state, the arrival text and the name on card accept anything — `@!_`, digits only, one character, or text of any length (no `maxLength` anywhere; `_contactValid` is just `trim().isNotEmpty`). These names end up on tickets and in the operator's booking list. | Light validation: a length limit and at least one letter, with hyphens, apostrophes, spaces and diacritics allowed (Novák-Svobodová, O'Brien, Šťastný) — over-strict name rules are a bug of their own. For names e.g. `RegExp(r"^(?=.*\p{L})[\p{L}\p{M} .'’-]{1,50}$", unicode: true)`; for city the same plus digits and `,/`. |
| 20 | Medium | Checkout | **The customer must accept terms they can't read.** Both required checkboxes — "Souhlasím s podmínkami rezervace" and "Souhlasím se storno podmínkami…" — are plain text with no link, and the cancellation/refund policy isn't shown anywhere before paying. For date-bound tickets, whether and until when you can cancel is exactly what a customer wants to know. | Linked terms, and the key cancellation rule (e.g. "free cancellation until 24 h before") stated next to the checkbox. |
| 21 | Medium | Success, Payment | **After "Domů" the order is gone for good.** There is no order lookup or history and — with no e-mail (#3) — the customer is left with nothing but an order code they saw once. There is also **no support contact anywhere**, not even on the declined-payment screen, whose message suggests "try another method" although card is the only one. (No account or settings menu is fine for a guest-checkout booking widget; this is about finding the order and getting help.) | Confirmation by e-mail with the order code, a way to look the order up, and a support contact at least on Success and on the declined screen. |

## Language and formatting

| # | Severity | Where | What happens |
| --- | --- | --- | --- |
| 22 | Medium | Home | In Czech the package text and button are **Slovak** ("Vybrať tento zájazd", "tri vyhliadkové miesta…"), and the description (three viewpoints and a sunset cruise) doesn't match the four products inside. |
| 23 | Medium | Everywhere | **Prices aren't localised**: always `toStringAsFixed(2)` + " €". Czech shows `49.50 €` instead of `49,50 €`; English mixes `From €30` (Home) and `From 30 €` (Tickets). There is no currency choice — a New York package is sold only in EUR (worth confirming with product). |
| 24 | Low | Date & time, Questions | Product names and descriptions stay **English** in the Czech UI — together with the Slovak Home screen, one booking shows three languages. |
| 25 | Low | Checkout | **Country names are always Czech**, also in English mode ("Spojené státy", "Německo"). |
| 26 | Low | Calendar | No weekday labels above the grid, and the month is shown as `11/2026`. |
| 27 | Low | Titles | English-style title case in Czech: "Datum A Čas", "Doplňující Informace". |
| 28 | Low | Home | "Od 30 €" / "From €30", while a child ticket costs 15 €. |

## Findings that have a test

Each of these has a flow in `test/maestro/known_issues/` that asserts the
expected behaviour, so it fails today and passes once the issue is fixed:
#3 e-mail field, #6 fee before paying, #8 state optional for Czechia,
#11 expiry month, #13 + at the limit, #17 age ranges, #22 Czech Home copy,
#23 decimal comma, #25 country names in English. (#27, the title case,
can't be expressed: Maestro matches text case-insensitively.)

## Testability

- **The "How did you hear about us?" options have no ids** (the country
  dropdown on Checkout has them), so `fill_questions.yaml` matches the
  visible label (`Sociální sítě` / `Social media`) — the only
  language-dependent selector in the suite.
  The country dropdown's pattern would fix it, e.g. in
  `screens/questions_screen.dart`:

  ```dart
  items: strings.bookingQuestionSelectOptions.indexed
      .map((e) => DropdownMenuItem(
            value: e.$2,
            child: Semantics(
              identifier: 'Questions_BookingSelectOption_${e.$1}',
              container: true,
              child: Text(e.$2),
            ),
          ))
      .toList(),
  ```

- Only the text-area error on Questions has an id
  (`Questions_ValidationError`). The dropdown and per-ticket errors, and the
  two "Vyžadováno" errors under the Checkout terms, have none — so a test
  can't tell *which* required field is missing. The text-area error alone
  also isn't shown when only the dropdown is empty.
- The calendar's previous-month button has no id (next-month does).
