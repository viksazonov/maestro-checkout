# Test report

## Build and environment

| | |
| --- | --- |
| App | `maestro_booking_demo` 1.0.0+1, release APK, branch `feat-creat-app-init` at `e5bf530` (app code unchanged) |
| Tools | Maestro 2.12.1, Flutter 3.47.9 |
| Emulator | Pixel 7 profile, Android 14 (`google_apis`, arm64), real `clearState` |
| Phone | OnePlus 7T Pro (HD1913), Android 12 / OxygenOS, run with `-e CLEAR_STATE=false` (see README, known limitations) |
| Dates | Night of 10–11 November 2026, re-runs on the 11th |
| Commands | `DEVICE=emulator-5554 ./run_tests.sh 3 -e APP_LANG=cs`<br>`DEVICE=emulator-5554 ./run_tests.sh 2 -e APP_LANG=en`<br>`DEVICE=d2183082 ./run_tests.sh 2 -e CLEAR_STATE=false` |

## Results

The suite (7 flows), runs back to back, every flow on a freshly launched
app. JUnit files of every run are in [docs/test-runs/](docs/test-runs/).

| Device | Language | Runs | Flows passed | Time per run |
| --- | --- | --- | --- | --- |
| Emulator | Czech | 3 | **21 / 21** | 9:12 – 9:33 |
| Emulator | English | 2 | **14 / 14** | 10:11 – 10:37 |
| OnePlus 7T Pro | Czech | 2 | 13 / 14 — see below | 23:26 |

Per flow — average (min–max):

| Flow | Emulator, Czech | Emulator, English | OnePlus |
| --- | --- | --- | --- |
| `purchase_flow` | 4:14 (4:05–4:18) | 4:19 (4:05–4:33) | 9:04 |
| `promo_code_rules` | 2:02 (2:01–2:04) | 2:09 (2:07–2:10) | 4:26 (3:48–5:05) |
| `datetime_dependencies` | 1:02 (1:00–1:05) | 1:13 | 3:29 (3:19–3:38) |
| `timeslots_closed` | 0:30 (0:28–0:31) | 0:38 (0:36–0:39) | 1:19 (1:04–1:34) |
| `max_tickets_cap` | 0:52 (0:52–0:53) | 1:01 | 2:47 (2:31–3:02) |
| `child_without_adult` | 0:26 (0:24–0:29) | 0:37 (0:35–0:39) | 1:09 |
| `double_tap_continue` | 0:18 (0:17–0:19) | 0:27 (0:26–0:29) | 0:45 (0:20–1:10) |

About half a minute of `purchase_flow` is the app's own simulated latency
(3–8 s on each of its five Continue / Confirm steps). Why the OnePlus is about
2.5× slower is described in the README (Maestro waiting on the view
hierarchy).

### The one failure, and what changed

In the second OnePlus run `purchase_flow` failed on Questions: with six
tickets it didn't find the sixth confirmation checkbox. The log shows two
swipes and then a 31-second stall of the kind described in the README, which
used up `scrollUntilVisible`'s 20-second limit. It is a timing limit, not a
logic error, and it can't happen on the emulator, where the stalls don't
occur. All `scrollUntilVisible` limits are now 60 s; the emulator suite passed
7 / 7 again after the change (the phone itself wasn't re-run).

### Findings as tests

`maestro test test/maestro/known_issues/` on the emulator: **9 / 9 fail, each on
its own finding** — the expected result (see FINDINGS.md, "Findings that have a test").

## Coverage: assignment → tests

| Step | Requirement | Where | What is asserted |
| --- | --- | --- | --- |
| 1 | Launch from a clean state | every flow → `helpers/fresh_launch.yaml` | `clearState` + relaunch; Home visible |
| 1 | Select NYC Icons Express | `purchase_flow` | Tickets page opens |
| 2 | Max 20 tickets combined | `max_tickets_cap` | 18 adults + 2 children; further + on either type is ignored |
| 2 | Child needs an adult — verified before the real selection | `helpers/select_tickets.yaml`, `child_without_adult` | Error shown and Continue doesn't start loading; also when the adult is removed afterwards |
| 2 | Random Adult / Child quantities | `helpers/random_tickets.js` | 1–4 adults, 0–3 children; counts checked on Tickets and Success, prices computed from them |
| 3 | Only the first product starts unlocked; confirming it unlocks the rest | `helpers/select_dates.yaml`, `datetime_dependencies` | Madame's dialog doesn't open and the ferry can't be confirmed before the first date; Hop-on stays locked until Madame has a time |
| 3 | Pick a date/time for another product | `helpers/select_dates.yaml` | Madame Tussauds 10:00 via the time-slot dialog; ferry date confirmed |
| 3 | Continue once mandatory products are set; optional left empty | `helpers/select_dates.yaml` | Hop-on Hop-off stays empty; Continue reaches Questions |
| 3 | "Reset selection" really clears | `helpers/select_dates.yaml` | Confirmed dates and the reset link disappear; Continue is blocked again |
| 4 | Continue without required fields → validation error | `helpers/fill_questions.yaml` | Error visible, no loading, still on Questions |
| 4 | Fill only the required fields | `helpers/fill_questions.yaml` | Text area, dropdown, one confirmation per ticket; optional questions untouched |
| 5 | Note the total | `helpers/fill_checkout.yaml` | Total equals the price computed from the random quantities |
| 5 | Fill required contact fields and pay | `helpers/fill_checkout.yaml`, `helpers/pay_by_card_declined.yaml`, `helpers/apply_promo_and_confirm.yaml` | Empty form shows errors; empty and too-short card rejected; valid card declined (by design, see FINDINGS #4); promo code → 0.00 → Confirm |
| 5–6 | Success shows the amount and a complete summary | `helpers/verify_success.yaml` | Order code format; ticket counts; the three booked products with dates and Madame's 10:00; Hop-on absent; per-type price lines; 10 % fee; original price; discount; 0.00 due |
| Bonus | Further edge cases | `promo_code_rules`, `datetime_dependencies`, `timeslots_closed`, `max_tickets_cap`, `child_without_adult`, `double_tap_continue` | See the flow table in the README |

## Not covered

- iOS, tablets and other screen sizes.
- A successful card payment — not possible in this build.
- The English UI; it becomes a simple parameter once the Questions dropdown
  options get ids (see FINDINGS.md, testability).
- The issues in [FINDINGS.md](FINDINGS.md) are documented, not asserted. A
  test that encodes today's wrong behaviour (e.g. past slots being bookable)
  would have to be flipped once it's fixed; they belong in tickets first.
- The full Hop-on Hop-off window — only the two-hour rule from 14:00.
