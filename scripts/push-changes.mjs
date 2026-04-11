import { execSync } from 'child_process';

const cwd = '/vercel/share/v0-project';

try {
  execSync('git add src/pages/Dashboard.tsx', { cwd, stdio: 'inherit' });
  execSync(`git commit -m "Restore Dashboard.tsx with put() from @vercel/blob and remove handleUploadUrl

Co-authored-by: v0[bot] <v0[bot]@users.noreply.github.com>"`, { cwd, stdio: 'inherit' });
  execSync('git push origin HEAD', { cwd, stdio: 'inherit' });
  console.log('Successfully pushed to GitHub');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
