#include "crypto_utils.hpp"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <chrono>
#include <random>
#include <openssl/pem.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>

namespace ForensicCrypto {

// ============================================================
// RSA Key Generation
// ============================================================

RSA* generateRSAKeyPair() {
    return generateRSAKeyPair(2048);
}

RSA* generateRSAKeyPair(int keySize) {
    RSA* rsa = RSA_new();
    BIGNUM* e = BN_new();
    BN_set_word(e, RSA_F4); // 65537
    
    if (!RSA_generate_key_ex(rsa, keySize, e, nullptr)) {
        std::cerr << "Error generating RSA key pair" << std::endl;
        RSA_free(rsa);
        BN_free(e);
        return nullptr;
    }
    
    BN_free(e);
    return rsa;
}

// ============================================================
// SHA-256 Hashing
// ============================================================

std::string sha256Hash(const std::string& data) {
    return sha256Hash(
        reinterpret_cast<const unsigned char*>(data.c_str()),
        data.length()
    );
}

std::string sha256Hash(const unsigned char* data, size_t len) {
    EVP_MD_CTX* ctx = EVP_MD_CTX_new();
    const EVP_MD* md = EVP_sha256();
    
    unsigned char hash[EVP_MAX_MD_SIZE];
    unsigned int hashLen;
    
    EVP_DigestInit_ex(ctx, md, nullptr);
    EVP_DigestUpdate(ctx, data, len);
    EVP_DigestFinal_ex(ctx, hash, &hashLen);
    
    EVP_MD_CTX_free(ctx);
    
    return bytesToHex(hash, hashLen);
}

// ============================================================
// Digital Signatures (RSA-PSS)
// ============================================================

std::string signData(RSA* privateKey, const std::string& hash) {
    unsigned char hashBytes[EVP_MAX_MD_SIZE];
    unsigned int hashLen;
    
    // Convert hex hash to bytes
    std::vector<unsigned char> hashVec = hexToBytes(hash);
    
    unsigned char* signature = new unsigned char[RSA_size(privateKey)];
    size_t sigLen;
    
    // RSA-PSS signing
    int result = RSA_sign_pss_mgf1(
        privateKey,
        &sigLen,
        hashVec.data(),
        hashVec.size(),
        signature,
        RSA_size(privateKey),
        EVP_sha256(),
        EVP_sha256(),
        -1  // Salt length: -1 for max
    );
    
    if (result != 1) {
        std::cerr << "Error signing data" << std::endl;
        delete[] signature;
        return "";
    }
    
    std::string sigBase64 = base64Encode(signature, sigLen);
    delete[] signature;
    
    return sigBase64;
}

bool verifySignature(RSA* publicKey, const std::string& hash, 
                     const std::string& signature) {
    // Convert hex hash to bytes
    std::vector<unsigned char> hashVec = hexToBytes(hash);
    
    // Decode signature from base64
    std::vector<unsigned char> sigVec = base64Decode(signature);
    
    // RSA-PSS verification
    int result = RSA_verify_pss_mgf1(
        publicKey,
        hashVec.data(),
        hashVec.size(),
        EVP_sha256(),
        EVP_sha256(),
        sigVec.data(),
        sigVec.size(),
        -1  // Salt length: -1 for max
    );
    
    return (result == 1);
}

// ============================================================
// X.509 Certificate Generation
// ============================================================

X509* generateSelfSignedCertificate(RSA* keyPair, 
                                    const std::string& subjectName) {
    X509* cert = X509_new();
    X509_set_version(cert, 2); // v3
    
    // Set serial number
    ASN1_INTEGER_set(X509_get_serialNumber(cert), rand());
    
    // Set validity period (1 year)
    X509_gmtime_adj(X509_get_notBefore(cert), 0);
    X509_gmtime_adj(X509_get_notAfter(cert), 365 * 24 * 60 * 60);
    
    // Set subject and issuer (self-signed)
    X509_NAME* name = X509_NAME_new();
    X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC,
                               (const unsigned char*)subjectName.c_str(), 
                               -1, -1, 0);
    X509_NAME_add_entry_by_txt(name, "O", MBSTRING_ASC,
                               (const unsigned char*)"Forensics Unit", 
                               -1, -1, 0);
    X509_NAME_add_entry_by_txt(name, "C", MBSTRING_ASC,
                               (const unsigned char*)"US", 
                               -1, -1, 0);
    
    X509_set_subject_name(cert, name);
    X509_set_issuer_name(cert, name);
    X509_NAME_free(name);
    
    // Set public key
    EVP_PKEY* pkey = EVP_PKEY_new();
    EVP_PKEY_assign_RSA(pkey, keyPair); // Does NOT copy key - be careful!
    X509_set_pubkey(cert, pkey);
    EVP_PKEY_free(pkey);
    
    // Add extensions
    X509V3_CTX ctx;
    X509V3_set_ctx_nodb(&ctx);
    X509V3_set_ctx(&ctx, cert, cert, nullptr, nullptr, 0);
    
    // Basic constraints
    X509_EXTENSION* ext = X509V3_EXT_conf_nid(nullptr, &ctx, 
                                               NID_basic_constraints, 
                                               (char*)"critical,CA:FALSE");
    X509_add_ext(cert, ext, -1);
    X509_EXTENSION_free(ext);
    
    // Key usage
    ext = X509V3_EXT_conf_nid(nullptr, &ctx, NID_key_usage,
                              (char*)"digitalSignature,nonRepudiation");
    X509_add_ext(cert, ext, -1);
    X509_EXTENSION_free(ext);
    
    // Subject key identifier
    ext = X509V3_EXT_conf_nid(nullptr, &ctx, NID_subject_key_identifier,
                              (char*)"hash");
    X509_add_ext(cert, ext, -1);
    X509_EXTENSION_free(ext);
    
    // Sign certificate
    X509_sign(cert, X509_get0_pubkey(cert), EVP_sha256());
    
    return cert;
}

std::string getCertificateFingerprint(X509* cert) {
    unsigned char fingerprint[EVP_MAX_MD_SIZE];
    unsigned int len;
    
    if (!X509_digest(cert, EVP_sha256(), fingerprint, &len)) {
        return "";
    }
    
    return bytesToHex(fingerprint, len);
}

std::string exportCertificatePEM(X509* cert) {
    BIO* bio = BIO_new(BIO_s_mem());
    PEM_write_bio_X509(bio, cert);
    
    char* data;
    long length = BIO_get_mem_data(bio, &data);
    std::string pem(data, length);
    
    BIO_free(bio);
    return pem;
}

std::string exportPrivateKeyPEM(RSA* key, const std::string& password) {
    BIO* bio = BIO_new(BIO_s_mem());
    EVP_PKEY* pkey = EVP_PKEY_new();
    EVP_PKEY_assign_RSA(pkey, key);
    
    if (password.empty()) {
        PEM_write_bio_PrivateKey(bio, pkey, nullptr, nullptr, 0, nullptr, nullptr);
    } else {
        PEM_write_bio_PrivateKey(bio, pkey, EVP_aes_256_cbc(),
                                 (unsigned char*)password.c_str(),
                                 password.length(), nullptr, nullptr);
    }
    
    char* data;
    long length = BIO_get_mem_data(bio, &data);
    std::string pem(data, length);
    
    BIO_free(bio);
    EVP_PKEY_free(pkey);
    return pem;
}

std::string exportPublicKeyPEM(RSA* key) {
    BIO* bio = BIO_new(BIO_s_mem());
    EVP_PKEY* pkey = EVP_PKEY_new();
    EVP_PKEY_assign_RSA(pkey, key);
    
    PEM_write_bio_PUBKEY(bio, pkey);
    
    char* data;
    long length = BIO_get_mem_data(bio, &data);
    std::string pem(data, length);
    
    BIO_free(bio);
    EVP_PKEY_free(pkey);
    return pem;
}

// ============================================================
// Helper Functions
// ============================================================

std::string bytesToHex(const unsigned char* data, size_t len) {
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (size_t i = 0; i < len; i++) {
        ss << std::setw(2) << (int)data[i];
    }
    return ss.str();
}

std::vector<unsigned char> hexToBytes(const std::string& hex) {
    std::vector<unsigned char> bytes;
    bytes.reserve(hex.length() / 2);
    
    for (size_t i = 0; i < hex.length(); i += 2) {
        std::string byteString = hex.substr(i, 2);
        unsigned char byte = static_cast<unsigned char>(
            std::stoi(byteString, nullptr, 16)
        );
        bytes.push_back(byte);
    }
    
    return bytes;
}

std::string base64Encode(const unsigned char* data, size_t len) {
    BIO* bio = BIO_new(BIO_s_mem());
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    bio = BIO_push(b64, bio);
    
    BIO_write(bio, data, len);
    BIO_flush(bio);
    
    char* encoded;
    long length = BIO_get_mem_data(bio, &encoded);
    std::string result(encoded, length);
    
    BIO_free_all(bio);
    return result;
}

std::vector<unsigned char> base64Decode(const std::string& base64) {
    BIO* bio = BIO_new_mem_buf(base64.c_str(), base64.length());
    BIO* b64 = BIO_new(BIO_f_base64());
    BIO_set_flags(b64, BIO_FLAGS_BASE64_NO_NL);
    bio = BIO_push(b64, bio);
    
    std::vector<unsigned char> result(base64.length());
    int len = BIO_read(bio, result.data(), result.size());
    
    BIO_free_all(bio);
    result.resize(len);
    return result;
}

std::string generateId() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    
    std::stringstream ss;
    ss << "EVID-" << time_t << "-";
    
    // Random suffix
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    
    for (int i = 0; i < 6; i++) {
        ss << std::hex << dis(gen);
    }
    
    return ss.str();
}

std::string getTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(
        now.time_since_epoch()
    ) % 1000;
    
    std::stringstream ss;
    ss << std::put_time(std::gmtime(&time_t), "%Y-%m-%dT%H:%M:%S");
    ss << "." << std::setfill('0') << std::setw(3) << ms.count() << "Z";
    
    return ss.str();
}

} // namespace ForensicCrypto
