#ifndef CRYPTO_UTILS_HPP
#define CRYPTO_UTILS_HPP

#include <string>
#include <vector>
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>

namespace ForensicCrypto {

// ============================================================
// RSA Key Generation
// ============================================================

/**
 * Generate RSA key pair (2048-bit)
 * Returns: RSA* (public + private key)
 */
RSA* generateRSAKeyPair();

/**
 * Generate RSA key pair with custom key size
 */
RSA* generateRSAKeyPair(int keySize);

// ============================================================
// SHA-256 Hashing
// ============================================================

/**
 * Generate SHA-256 hash of data
 * Returns: Hex string of the hash
 */
std::string sha256Hash(const std::string& data);

/**
 * Generate SHA-256 hash of binary data
 */
std::string sha256Hash(const unsigned char* data, size_t len);

// ============================================================
// Digital Signatures (RSA-PSS)
// ============================================================

/**
 * Sign data with RSA private key using RSA-PSS
 * Returns: Base64 encoded signature
 */
std::string signData(RSA* privateKey, const std::string& hash);

/**
 * Verify signature with RSA public key
 * Returns: true if signature is valid
 */
bool verifySignature(RSA* publicKey, const std::string& hash, 
                     const std::string& signature);

// ============================================================
// X.509 Certificate Generation
// ============================================================

/**
 * Generate a self-signed X.509 certificate
 */
X509* generateSelfSignedCertificate(RSA* keyPair, 
                                    const std::string& subjectName);

/**
 * Get certificate fingerprint (SHA-256)
 */
std::string getCertificateFingerprint(X509* cert);

/**
 * Export certificate to PEM string
 */
std::string exportCertificatePEM(X509* cert);

/**
 * Export private key to PEM string (encrypted or unencrypted)
 */
std::string exportPrivateKeyPEM(RSA* key, const std::string& password = "");

/**
 * Export public key to PEM string
 */
std::string exportPublicKeyPEM(RSA* key);

// ============================================================
// Helper Functions
// ============================================================

/**
 * Convert binary to hex string
 */
std::string bytesToHex(const unsigned char* data, size_t len);

/**
 * Convert hex string to binary
 */
std::vector<unsigned char> hexToBytes(const std::string& hex);

/**
 * Base64 encode
 */
std::string base64Encode(const unsigned char* data, size_t len);

/**
 * Base64 decode
 */
std::vector<unsigned char> base64Decode(const std::string& base64);

/**
 * Generate random ID
 */
std::string generateId();

/**
 * Get current timestamp in ISO format
 */
std::string getTimestamp();

} // namespace ForensicCrypto

#endif // CRYPTO_UTILS_HPP
