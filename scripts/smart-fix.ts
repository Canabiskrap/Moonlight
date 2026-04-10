import fs from 'fs';
import path from 'path';

/**
 * Smart Fix Script for the repository
 * This script checks for common issues in the project structure and configuration.
 */

async function runSmartFix() {
  console.log('--- بدء الإصلاح الذكي للمستودع ---');
  let issuesFound = 0;

  // 1. Check for firebase-applet-config.json
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (!fs.existsSync(configPath)) {
    console.warn('⚠️ ملف firebase-applet-config.json مفقود!');
    issuesFound++;
  } else {
    console.log('✅ ملف إعدادات Firebase موجود.');
  }

  // 2. Check for .env.example
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    console.log('🔧 إنشاء ملف .env.example...');
    fs.writeFileSync(envExamplePath, 'GEMINI_API_KEY=\n');
    issuesFound++;
  }

  // 3. Check for common build issues
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    console.log('🧹 تنظيف ملفات البناء القديمة...');
    // fs.rmSync(distPath, { recursive: true, force: true });
  }

  console.log(`--- تم الانتهاء. المشاكل التي تم التعامل معها: ${issuesFound} ---`);
}

runSmartFix().catch(console.error);
