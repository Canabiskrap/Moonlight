#!/bin/bash
cd /vercel/share/v0-project

git add src/pages/Dashboard.tsx
git commit -m "Restore Dashboard.tsx with put() from @vercel/blob and remove handleUploadUrl

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"
git push origin HEAD
