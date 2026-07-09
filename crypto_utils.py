"""
Cryptographic utilities for forensic evidence handling.
Uses real PKI operations with RSA and X.509 certificates.
"""

import hashlib
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.backends import default_backend
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import serialization
import datetime
import os


def generate_rsa_key_pair(key_size: int = 2048):
    """
    Generate an RSA key pair for PKI operations.
    
    Returns:
        private_key: RSA private key object
        public_key: RSA public key object
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
        backend=default_backend()
    )
    public_key = private_key.public_key()
    return private_key, public_key


def generate_self_signed_certificate(private_key, subject_name: str = "Forensic Investigator"):
    """
    Generate a self-signed X.509 certificate.
    
    In a real PKI, this would be issued by a CA. For demonstration,
    we create a self-signed certificate.
    """
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "California"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "San Francisco"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Digital Forensics Unit"),
        x509.NameAttribute(NameOID.COMMON_NAME, subject_name),
    ])

    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        private_key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.utcnow()
    ).not_valid_after(
        datetime.datetime.utcnow() + datetime.timedelta(days=365)
    ).add_extension(
        x509.BasicConstraints(ca=False, path_length=None),
        critical=True,
    ).sign(private_key, hashes.SHA256(), default_backend())

    return cert


def hash_evidence(data: bytes) -> str:
    """
    Generate SHA-256 hash of evidence data.
    """
    return hashlib.sha256(data).hexdigest()


def sign_evidence(data_hash: str, private_key) -> bytes:
    """
    Digitally sign evidence using RSA-PSS.
    
    This is the actual PKI operation - the signature provides
    non-repudiation and integrity.
    """
    # Convert hex hash to bytes
    hash_bytes = bytes.fromhex(data_hash)
    
    signature = private_key.sign(
        hash_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return signature


def verify_signature(data_hash: str, signature: bytes, public_key) -> bool:
    """
    Verify digital signature using RSA-PSS.
    """
    try:
        hash_bytes = bytes.fromhex(data_hash)
        public_key.verify(
            signature,
            hash_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False


def serialize_private_key(private_key, password: bytes = None) -> bytes:
    """
    Serialize private key to PEM format (optionally encrypted).
    """
    encryption_alg = serialization.BestAvailableEncryption(password) if password else serialization.NoEncryption()
    return private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=encryption_alg
    )


def serialize_public_key(public_key) -> bytes:
    """
    Serialize public key to PEM format.
    """
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )


def serialize_certificate(cert) -> bytes:
    """
    Serialize X.509 certificate to PEM format.
    """
    return cert.public_bytes(serialization.Encoding.PEM)


def load_private_key(pem_data: bytes, password: bytes = None) -> rsa.RSAPrivateKey:
    """
    Load private key from PEM data.
    """
    return serialization.load_pem_private_key(pem_data, password=password, backend=default_backend())


def load_public_key(pem_data: bytes) -> rsa.RSAPublicKey:
    """
    Load public key from PEM data.
    """
    return serialization.load_pem_public_key(pem_data, backend=default_backend())


def load_certificate(pem_data: bytes) -> x509.Certificate:
    """
    Load X.509 certificate from PEM data.
    """
    return x509.load_pem_x509_certificate(pem_data, default_backend())
