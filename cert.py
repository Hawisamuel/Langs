"""
Certificate management for forensic investigators.
"""

from cryptography import x509
from cryptography.x509.oid import NameOID
import datetime
import os
from typing import Optional, Tuple

from .crypto_utils import (
    generate_rsa_key_pair,
    generate_self_signed_certificate,
    serialize_certificate,
    serialize_private_key,
    serialize_public_key
)


class ForensicCertificate:
    """Wrapper for X.509 certificates used in forensic operations."""
    
    def __init__(self, subject_name: str = "Forensic Investigator"):
        self.subject_name = subject_name
        self.private_key, self.public_key = generate_rsa_key_pair()
        self.certificate = generate_self_signed_certificate(
            self.private_key, 
            subject_name
        )
        self.cert_pem = serialize_certificate(self.certificate)
        self.private_key_pem = serialize_private_key(self.private_key)
        self.public_key_pem = serialize_public_key(self.public_key)
    
    def get_fingerprint(self) -> str:
        """Get SHA-256 fingerprint of the certificate."""
        return self.certificate.fingerprint(hashes.SHA256()).hex()
    
    def get_subject(self) -> str:
        """Get the certificate subject name."""
        return self.certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)[0].value
    
    def get_serial_number(self) -> str:
        """Get the certificate serial number."""
        return hex(self.certificate.serial_number)
    
    def get_validity(self) -> Tuple[datetime.datetime, datetime.datetime]:
        """Get certificate validity period."""
        return (self.certificate.not_valid_before, self.certificate.not_valid_after)
    
    def is_valid(self) -> bool:
        """Check if certificate is currently valid."""
        now = datetime.datetime.utcnow()
        return self.certificate.not_valid_before <= now <= self.certificate.not_valid_after
    
    def export_to_files(self, base_filename: str):
        """
        Export certificate and keys to PEM files.
        """
        # Certificate
        with open(f"{base_filename}.crt", "wb") as f:
            f.write(self.cert_pem)
        
        # Private key (secure - should be encrypted in production)
        with open(f"{base_filename}.key", "wb") as f:
            f.write(self.private_key_pem)
        
        # Public key
        with open(f"{base_filename}.pub", "wb") as f:
            f.write(self.public_key_pem)
        
        print(f"✅ Exported certificate to {base_filename}.crt")
        print(f"✅ Exported private key to {base_filename}.key")
        print(f"✅ Exported public key to {base_filename}.pub")
    
    def __str__(self) -> str:
        return f"""
╔══════════════════════════════════════════════════════════════╗
║           FORENSIC CERTIFICATE INFORMATION                  ║
╠══════════════════════════════════════════════════════════════╣
║ Subject:           {self.get_subject()}
║ Serial Number:     {self.get_serial_number()}
║ Fingerprint:       {self.get_fingerprint()[:40]}...
║ Valid From:        {self.get_validity()[0]}
║ Valid To:          {self.get_validity()[1]}
║ Status:            {'✅ Valid' if self.is_valid() else '❌ Expired'}
╚══════════════════════════════════════════════════════════════╝
        """
