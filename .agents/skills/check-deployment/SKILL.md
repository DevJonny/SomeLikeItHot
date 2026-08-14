---
name: check-deployment
description: >-
  Use this skill when modifying the build process, configuring Vite, or debugging GitHub Pages deployment failures.
---

# GitHub Pages Deployment & CI

This repository uses a custom GitHub Actions workflow to deploy the Vite React app to GitHub Pages.

## Verification Steps

When you modify dependencies, change the `vite.config.js`, or if the user reports a deployment failure, you MUST verify the deployment pipeline:

1.  **Check Workflow Status**: 
    Use the GitHub CLI to view the status of recent deployments:
    `gh run list --limit 3`
2.  **View Logs**: 
    If a run failed, view the logs:
    `gh run view <RUN_ID> --log`
3.  **Validate Vite Config**: 
    Ensure `vite.config.js` always contains `base: '/SomeLikeItHot/'`. Without this, assets will 404 on GitHub pages.

## Common Failures

*   **Setup Pages fails with "Not Found"**: This means the repository isn't configured for GitHub Actions deployments. We use `enablement: true` in our `deploy.yml` to automatically fix this, but if it fails, instruct the user to manually enable it in Settings > Pages.
*   **Asset 404s**: This is almost always caused by a missing or incorrect `base` path in `vite.config.js` or `index.html`.
