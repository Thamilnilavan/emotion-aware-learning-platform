const fs = require('fs');
const path = require('path');

const fixAdmin = () => {
  const file = path.join(__dirname, 'src', 'services', 'api', 'admin.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import axios from 'axios';/, "import api from '@/lib/axios';");
  content = content.replace(/const API_BASE_URL = [^\n]+\n+/, "");
  content = content.replace(/axios\.(get|post|put|delete)\(`\$\{API_BASE_URL\}\/admin/g, "api.$1(`/admin");
  fs.writeFileSync(file, content);
};

const fixAi = () => {
  const file = path.join(__dirname, 'src', 'services', 'api', 'ai.ts');
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/import axios from 'axios';/, "import api from '@/lib/axios';");
  content = content.replace(/const API_BASE_URL = [^\n]+\n+/, "");
  content = content.replace(/axios\.(get|post|put|delete)\(`\$\{API_BASE_URL\}\/api\/ai/g, "api.$1(`/ai");
  fs.writeFileSync(file, content);
};

fixAdmin();
fixAi();
console.log('Fixed API files properly');
