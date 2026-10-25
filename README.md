# avakanksh.github.io

Personal site for Av Akanksh — M.S. by Research, Centre for Machine Intelligence
and Data Science, IIT Bombay. Built with [Hugo](https://gohugo.io/) and deployed to
GitHub Pages by `.github/workflows/hugo.yml` on every push to `master`.

## Editing the content

Everything on the page is data. You should not need to touch a template to change
what the site says.

| File | What lives there |
| --- | --- |
| `data/profile.yaml` | Name, role, hero copy, focus areas, social links, skills table |
| `data/work.yaml` | Research, industry experience, education, responsibilities, competitions |
| `data/projects.yaml` | Featured projects, earlier work, open-source repository list |
| `data/resumes.yaml` | Résumé variants |
| `config.yaml` | Site settings and the left-hand navigation |

### Adding a project

Append an entry to `featured` in `data/projects.yaml`:

```yaml
  - title: "Project name"
    subtitle: "One line on what it is"
    period: "2026"
    sort: 2026.5            # controls ordering; higher sorts first
    focus: quant            # quant | ml | systems | product
    body: |
      A paragraph or two.
    metrics:                # optional, keep to three
      - value: "19.5×"
        label: "what that number measures"
    tags: ["DuckDB", "Parquet"]
    links:
      - type: repo          # repo | demo | slides | video | paper
        url: "https://github.com/AvAkanksh/..."
```

### Adding a résumé

1. Put the PDF in `static/resume/`.
2. Add an entry to `variants` in `data/resumes.yaml`. Exactly one entry should
   carry `default: true` — that is the one the preview and hero button open.

## Running it locally

```sh
hugo server
```

Then open http://localhost:1313. The site needs Hugo 0.124 or newer; the CI
workflow pins 0.124.1.

## How it is built

- `layouts/` holds the templates. `layouts/index.html` composes the single page
  from the partials in `layouts/partials/sections/`.
- `assets/css/main.css` and `assets/js/site.js` are processed by Hugo Pipes
  (minified and fingerprinted with subresource integrity).
- The visual direction is recorded in `DESIGN-BRIEF.md` — read it before
  changing colour, type or motion.
- Motion is GSAP 3.13.0 from cdnjs (pinned). Every animation uses `gsap.from()`,
  so the page renders complete without JavaScript, and all of it is skipped
  under `prefers-reduced-motion`.
- No Bootstrap, no jQuery, no icon font.

The `themes/hugo-profile` submodule is left over from the previous design and is
no longer used; it can be removed with
`git submodule deinit -f themes/hugo-profile && git rm -f themes/hugo-profile`.
