import "dotenv/config";
import {
  validateThaiCID,
  encryptCID,
  decryptCID,
  hashCID,
  maskCID,
  sanitizeCID,
} from "./security";

// ANSI colors for clean test reporting
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ${GREEN}✓${RESET} ${description}`);
    passedCount++;
  } else {
    console.error(`  ${RED}✗ FAIL:${RESET} ${description}`);
    failedCount++;
  }
}

console.log(`${CYAN}====================================================${RESET}`);
console.log(`${CYAN}  NPC_Admission: Security & Cryptography Unit Tests ${RESET}`);
console.log(`${CYAN}====================================================\n${RESET}`);

// Test Suite 1: Sanitization
console.log(`${CYAN}[1] Testing Sanitization${RESET}`);
assert(sanitizeCID("1-5599-00123-45-3") === "1559900123453", "Removes dashes correctly");
assert(sanitizeCID("1 5599 00123 45 3") === "1559900123453", "Removes spaces correctly");
assert(sanitizeCID("abc1559900123453xyz") === "1559900123453", "Strips non-numeric characters");

// Test Suite 2: Checksum Validation (Thai Citizen ID)
console.log(`\n${CYAN}[2] Testing Thai CID Checksum (Modulo 11 Algorithm)${RESET}`);
assert(validateThaiCID("1559900123453") === true, "Validates correct 13-digit CID (Sample 1)");
assert(validateThaiCID("1-5501-00456-78-6") === true, "Validates correct formatted CID (Sample 2)");
assert(validateThaiCID("1559900123454") === false, "Rejects wrong check digit (expected 3, got 4)");
assert(validateThaiCID("0559900123453") === false, "Rejects CID starting with 0");
assert(validateThaiCID("123456789012") === false, "Rejects CID with only 12 digits");
assert(validateThaiCID("12345678901234") === false, "Rejects CID with 14 digits");
assert(validateThaiCID("abcdefghijklm") === false, "Rejects purely alphabetic input");

// Test Suite 3: AES-256-GCM Encryption & Decryption
console.log(`\n${CYAN}[3] Testing AES-256-GCM Encryption & Decryption${RESET}`);
const testCID = "1559900123453";
const encrypted1 = encryptCID(testCID);
const encrypted2 = encryptCID(testCID);

assert(
  encrypted1 !== encrypted2,
  "Semantic Security: Two encryptions of the same CID produce different ciphertexts (random IV)"
);

const decrypted1 = decryptCID(encrypted1);
const decrypted2 = decryptCID(encrypted2);
assert(decrypted1 === testCID, "Decrypting ciphertext 1 successfully restores original CID");
assert(decrypted2 === testCID, "Decrypting ciphertext 2 successfully restores original CID");

// Test Tampering Detection (Authenticated Encryption)
let tampered = false;
try {
  const parts = encrypted1.split(":");
  // Alter the ciphertext slightly
  const corruptedCipher = parts[2].substring(0, parts[2].length - 2) + "ff";
  decryptCID(`${parts[0]}:${parts[1]}:${corruptedCipher}`);
} catch {
  tampered = true;
}
assert(tampered, "AEAD Integrity check: Detects and rejects tampered ciphertext");

// Test Suite 4: HMAC-SHA256 Hashing
console.log(`\n${CYAN}[4] Testing HMAC-SHA256 Hashing (Search & Duplicate Prevention)${RESET}`);
const hash1 = hashCID(testCID);
const hash2 = hashCID("1-5599-00123-45-3"); // with formatting
const hashOther = hashCID("1550100456786");

assert(hash1 === hash2, "Deterministic: Formatting differences yield the exact same HMAC hash");
assert(hash1.length === 64, "Produces standard 64-character SHA-256 hex string");
assert(hash1 !== hashOther, "Different CIDs produce completely different hashes");

// Test Suite 5: Masking
console.log(`\n${CYAN}[5] Testing CID Masking${RESET}`);
const masked1 = maskCID("1559900123453");
const masked2 = maskCID("1-5501-00456-78-6");

assert(masked1 === "1-55XX-XXXXX-45-3", `Masked CID format matches standard: ${masked1}`);
assert(masked2 === "1-55XX-XXXXX-78-6", `Masked CID format matches standard: ${masked2}`);

// Summary
console.log(`\n${CYAN}----------------------------------------------------${RESET}`);
if (failedCount === 0) {
  console.log(`${GREEN}ALL ${passedCount} TESTS PASSED SUCCESSFULLY! (100% Correct)${RESET}`);
  console.log(`${CYAN}====================================================\n${RESET}`);
  process.exit(0);
} else {
  console.error(`${RED}FAILED: ${failedCount} test(s) failed, ${passedCount} passed.${RESET}`);
  console.log(`${CYAN}====================================================\n${RESET}`);
  process.exit(1);
}
