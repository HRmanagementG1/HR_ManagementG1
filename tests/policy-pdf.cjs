const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { jsPDF } = require('../Shared/vendor/jspdf.umd.min.js');
const source = fs.readFileSync(path.join(__dirname, '../Ahmad/policyEmp/policyEmp.js'), 'utf8');
const download = source.slice(source.indexOf('function download(policy)'), source.indexOf('get("policy-search").addEventListener'));
const policies = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/policies.json'), 'utf8'));
const status = {};
let saved = 0;
function TestPDF() {
  const pdf = new jsPDF();
  pdf.save = filename => {
    assert.match(filename, /\.pdf$/i);
    const bytes = Buffer.from(pdf.output('arraybuffer'));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert(bytes.length > 1000);
    saved++;
  };
  return pdf;
}
const context = { jspdf: { jsPDF: TestPDF }, get: () => status, console };
vm.runInNewContext(download, context);
for (const policy of policies) {
  context.download(policy);
  assert.equal(status.textContent, 'PDF ready.');
}
assert.equal(saved, policies.length);
console.log(`PASS: real jsPDF generation for all ${saved} policies.`);
