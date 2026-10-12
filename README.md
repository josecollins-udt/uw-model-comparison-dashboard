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
- Reduced (pkgs 1, 3, 7, 8, 22 ev/am75, 25 ev/am75): https://josecollins-udt.github.io/uw-model-comparison-dashboard/reduced/

Rebuild after scores change:

```
python scripts/generate_pages_dashboard.py
```

Then commit the updated `pages/` files.

JSON has no `user_id`. Plotly loads from cdn.plot.ly.
