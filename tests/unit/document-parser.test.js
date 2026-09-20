import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  extractDocumentText,
  validateFileSignature,
  extractRtfText,
  SUPPORTED_EXTENSIONS,
  MAX_DOCUMENT_BYTES
} from '../../server/services/documentParserService.js';
import { AppError } from '../../server/utils/errors.js';

test('SUPPORTED_EXTENSIONS includes all 5 required legal document formats', () => {
  for (const ext of ['.pdf', '.docx', '.txt', '.md', '.rtf']) {
    assert.ok(SUPPORTED_EXTENSIONS.includes(ext), `Expected ${ext} to be supported`);
  }
});

test('validateFileSignature detects valid and invalid magic bytes', () => {
  assert.equal(validateFileSignature(Buffer.from('%PDF-1.4 header'), '.pdf'), true);
  assert.equal(validateFileSignature(Buffer.from('not a pdf header'), '.pdf'), false);

  assert.equal(validateFileSignature(Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]), '.docx'), true);
  assert.equal(validateFileSignature(Buffer.from([0x00, 0x00, 0x00, 0x00]), '.docx'), false);

  assert.equal(validateFileSignature(Buffer.from('{\\rtf1\\ansi...'), '.rtf'), true);
  assert.equal(validateFileSignature(Buffer.from('plain text file'), '.rtf'), false);

  assert.equal(validateFileSignature(Buffer.from('Hello world contract'), '.txt'), true);
  assert.equal(validateFileSignature(Buffer.from([0x48, 0x00, 0x49]), '.txt'), false);
});

test('extractRtfText strips RTF tags and formatting cleanly', () => {
  const rtf = '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\viewkind4\\uc1\\pard\\b Non-Disclosure Agreement\\b0\\par Confidentiality obligations apply.\\par}';
  const text = extractRtfText(rtf);
  assert.ok(text.includes('Non-Disclosure Agreement'));
  assert.ok(text.includes('Confidentiality obligations apply.'));
  assert.ok(!text.includes('\\rtf1'));
  assert.ok(!text.includes('\\fonttbl'));
});

test('extractDocumentText parses sample PDF fixture correctly', async () => {
  const buffer = fs.readFileSync(path.resolve('tests/fixtures/sample-nda.pdf'));
  const result = await extractDocumentText({
    filename: 'sample-nda.pdf',
    mimeType: 'application/pdf',
    buffer
  });

  assert.equal(result.extension, 'PDF');
  assert.ok(result.characterCount > 50);
  assert.ok(result.wordCount > 10);
  assert.ok(result.text.includes('MUTUAL NON-DISCLOSURE AGREEMENT'));
  assert.ok(result.text.includes('Confidential Information'));
});

test('extractDocumentText parses sample DOCX employment agreement correctly', async () => {
  const buffer = fs.readFileSync(path.resolve('tests/fixtures/sample-employment-agreement.docx'));
  const result = await extractDocumentText({
    filename: 'sample-employment-agreement.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer
  });

  assert.equal(result.extension, 'DOCX');
  assert.ok(result.characterCount > 100);
  assert.ok(result.wordCount > 20);
  assert.ok(result.text.includes('EMPLOYMENT AGREEMENT'));
  assert.ok(result.text.includes('Acme Corporation'));
  assert.ok(result.text.includes('Termination'));
});

test('extractDocumentText parses sample RTF consulting agreement correctly', async () => {
  const buffer = fs.readFileSync(path.resolve('tests/fixtures/sample-consulting.rtf'));
  const result = await extractDocumentText({
    filename: 'sample-consulting.rtf',
    mimeType: 'application/rtf',
    buffer
  });

  assert.equal(result.extension, 'RTF');
  assert.ok(result.text.includes('CONSULTING SERVICES AGREEMENT'));
  assert.ok(result.text.includes('Invoicing'));
});

test('extractDocumentText parses sample TXT and MD agreements correctly', async () => {
  const txtBuf = fs.readFileSync(path.resolve('tests/fixtures/sample-agreement.txt'));
  const txtRes = await extractDocumentText({
    filename: 'sample-agreement.txt',
    mimeType: 'text/plain',
    buffer: txtBuf
  });
  assert.equal(txtRes.extension, 'TXT');
  assert.ok(txtRes.text.includes('INDEPENDENT CONTRACTOR AGREEMENT'));

  const mdBuf = fs.readFileSync(path.resolve('tests/fixtures/sample-terms.md'));
  const mdRes = await extractDocumentText({
    filename: 'sample-terms.md',
    mimeType: 'text/markdown',
    buffer: mdBuf
  });
  assert.equal(mdRes.extension, 'MD');
  assert.ok(mdRes.text.includes('SERVICE LEVEL AGREEMENT'));
});

test('extractDocumentText rejects unsupported file extensions', async () => {
  await assert.rejects(
    () => extractDocumentText({
      filename: 'malware.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ...')
    }),
    (err) => err instanceof AppError && err.statusCode === 415 && err.code === 'UNSUPPORTED_FORMAT'
  );
});

test('extractDocumentText rejects mismatched file signatures (corrupted content)', async () => {
  await assert.rejects(
    () => extractDocumentText({
      filename: 'fake-document.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer: Buffer.from('this is plain text not a zip file')
    }),
    (err) => err instanceof AppError && err.statusCode === 400 && err.code === 'CORRUPTED_FILE'
  );
});

test('extractDocumentText rejects oversized document files', async () => {
  const hugeBuf = Buffer.alloc(MAX_DOCUMENT_BYTES + 100);
  await assert.rejects(
    () => extractDocumentText({
      filename: 'huge.txt',
      mimeType: 'text/plain',
      buffer: hugeBuf
    }),
    (err) => err instanceof AppError && err.statusCode === 413 && err.code === 'FILE_TOO_LARGE'
  );
});

test('extractDocumentText rejects empty files', async () => {
  await assert.rejects(
    () => extractDocumentText({
      filename: 'empty.txt',
      mimeType: 'text/plain',
      buffer: Buffer.alloc(0)
    }),
    (err) => err instanceof AppError && err.statusCode === 422 && err.code === 'EMPTY_FILE'
  );
});
