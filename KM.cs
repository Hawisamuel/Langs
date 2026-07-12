using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace ForensicEvidenceDotNet.Crypto;

/// <summary>
/// Manages RSA key pair generation, storage, and loading
/// </summary>
public class KeyManager : IDisposable
{
    public RSA PrivateKey { get; private set; }
    public RSA PublicKey { get; private set; }

    public KeyManager(int keySize = 2048)
    {
        PrivateKey = RSA.Create(keySize);
        PublicKey = RSA.Create();
        
        // Export public key from private key
        var publicKeyBytes = PrivateKey.ExportRSAPublicKey();
        PublicKey.ImportRSAPublicKey(publicKeyBytes, out _);
    }

    public KeyManager(byte[] privateKeyData, bool isPem = false)
    {
        if (isPem)
        {
            PrivateKey = RSA.Create();
            PrivateKey.ImportFromPem(Encoding.UTF8.GetString(privateKeyData));
        }
        else
        {
            PrivateKey = RSA.Create();
            PrivateKey.ImportRSAPrivateKey(privateKeyData, out _);
        }

        PublicKey = RSA.Create();
        var publicKeyBytes = PrivateKey.ExportRSAPublicKey();
        PublicKey.ImportRSAPublicKey(publicKeyBytes, out _);
    }

    /// <summary>
    /// Export private key as PEM
    /// </summary>
    public string ExportPrivateKeyPem()
    {
        var privateKeyBytes = PrivateKey.ExportRSAPrivateKey();
        return ExportKeyToPem(privateKeyBytes, "RSA PRIVATE KEY");
    }

    /// <summary>
    /// Export public key as PEM
    /// </summary>
    public string ExportPublicKeyPem()
    {
        var publicKeyBytes = PrivateKey.ExportRSAPublicKey();
        return ExportKeyToPem(publicKeyBytes, "RSA PUBLIC KEY");
    }

    /// <summary>
    /// Export private key as PKCS#8 PEM
    /// </summary>
    public string ExportPrivateKeyPkcs8Pem()
    {
        var privateKeyBytes = PrivateKey.ExportPkcs8PrivateKey();
        return ExportKeyToPem(privateKeyBytes, "PRIVATE KEY");
    }

    /// <summary>
    /// Export public key as PKCS#8 PEM
    /// </summary>
    public string ExportPublicKeyPkcs8Pem()
    {
        var publicKeyBytes = PrivateKey.ExportPkcs8PublicKey();
        return ExportKeyToPem(publicKeyBytes, "PUBLIC KEY");
    }

    /// <summary>
    /// Save keys to files
    /// </summary>
    public void SaveToFiles(string basePath)
    {
        File.WriteAllText($"{basePath}.private.pem", ExportPrivateKeyPem());
        File.WriteAllText($"{basePath}.public.pem", ExportPublicKeyPem());
        File.WriteAllText($"{basePath}.private.pkcs8.pem", ExportPrivateKeyPkcs8Pem());
    }

    /// <summary>
    /// Load keys from PEM files
    /// </summary>
    public static KeyManager LoadFromPemFiles(string privateKeyPath, string publicKeyPath)
    {
        var privatePem = File.ReadAllText(privateKeyPath);
        var publicPem = File.ReadAllText(publicKeyPath);

        var rsa = RSA.Create();
        rsa.ImportFromPem(privatePem);

        var keyManager = new KeyManager();
        keyManager.PrivateKey = rsa;
        keyManager.PublicKey = RSA.Create();
        keyManager.PublicKey.ImportFromPem(publicPem);

        return keyManager;
    }
    private static string ExportKeyToPem(byte[] keyData, string label)
    {
        var base64 = Convert.ToBase64String(keyData);
        var sb = new StringBuilder();
        sb.AppendLine($"-----BEGIN {label}-----");
        
        for (int i = 0; i < base64.Length; i += 64)
        {
            var chunkLength = Math.Min(64, base64.Length - i);
            sb.AppendLine(base64.Substring(i, chunkLength));
        }
        
        sb.AppendLine($"-----END {label}-----");
        return sb.ToString();
    }

    public void Dispose()
    {
        PrivateKey?.Dispose();
        PublicKey?.Dispose();
    }
     private static string ExportKeyToPem(byte[] keyData, string label)
    {
        var base64 = Convert.ToBase64String(keyData);
        var sb = new StringBuilder();
        sb.AppendLine($"-----BEGIN {label}-----");
        
        for (int i = 0; i < base64.Length; i += 64)
        {
            var chunkLength = Math.Min(64, base64.Length - i);
            sb.AppendLine(base64.Substring(i, chunkLength));
        }
        
        sb.AppendLine($"-----END {label}-----");
        return sb.ToString();
    }

}
