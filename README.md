# Remote UW comparison dashboard (GitHub Pages)

Static copy of `scripts/streamlit_dashboard.py`. Interactive Plotly hover, package picker,
90/95/99% CI and optional shaded bands. No Streamlit server.

## Publish

1. Create an empty GitHub repo.
2. Copy **the contents of this `pages/` folder** to the repo root (`index.html` must be at the root).
3. Settings → Pages → Deploy from branch `main` / root.
4. Open `https://<user>.github.io/<repo>/`.

Live copies:

- Full (Fritz): https://josecollins-udt.github.io/uw-model-comparison-dashboard/
- Union Almost Full: https://josecollins-udt.github.io/uw-model-comparison-dashboard/union/
- Reduced (pkgs 1, 3, 7, 8 and every hurdle 22, 25, 26-31 with all heads ev/am25/am50/am75/am80/am85/am90/amstar): https://josecollins-udt.github.io/uw-model-comparison-dashboard/reduced/
- Sigmoid multipliers, productive v25 vs hurdle v26 (score distributions, sigmoid fits, plain and composed credit-limit / interest multipliers; one self-contained file, plotly.js inlined; built by `scripts/sigmoid_dash_html.py` in uw_new_model, snapshot 2026-11-04): https://josecollins-udt.github.io/uw-model-comparison-dashboard/sigmoid/
- Interest earned and lost principal, productive v25 vs a chosen v26 policy (stored-score periods of 60 / 90 / 180 / 360 days plus a decision-time score mode with v25 live / refit / historic sigmoid, two re-pricing approaches, gates on/off, delinquency vs acceptance with matched-cutoff shortcuts, match-v25-schedule, price-response scenario, profit surface by score band and a time-split grid search, and a switch to include users approved by rule (proven good / loans whitelist) with their own profit and loss in section 3b, two credit-line usage scenarios (v26 users keep the same amount unless they spent the whole line; every user at the whole line) in section 3c, the distribution of line usage by score and multiplier in section 3d, an exploratory reweighting of the history users to the requesters' score mix in section 3e (and dashed curves in section 1) and, at the top, the principal added, principal lost and interest collected by the users approved by rule; one self-contained file, plotly.js inlined, aggregates only; built by `scripts/pnl_dash_html.py` in uw_new_model, snapshot 2026-11-05): https://josecollins-udt.github.io/uw-model-comparison-dashboard/pnl/

Rebuild after scores change:

```
python scripts/generate_pages_dashboard.py
```

Then commit the updated `pages/` files.

JSON has no `user_id`. Plotly loads from cdn.plot.ly.
