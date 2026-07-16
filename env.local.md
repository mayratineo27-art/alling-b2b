
# === BASE DE DATOS (Neon/Supabase) ===
DATABASE_URL="postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/allin?sslmode=require"

# === AUTENTICACIÓN (NextAuth / JWT) ===
NEXTAUTH_SECRET="tu_secreto_super_largo_y_aleatorio_aqui"
NEXTAUTH_URL="http://localhost:3000"
JWT_RS256_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_RS256_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"

# === MERCADO PAGO SANDBOX ===
MP_PUBLIC_KEY="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MP_ACCESS_TOKEN="TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
MP_WEBHOOK_SECRET="tu_secreto_para_validar_firmas_hmac"

# === DISTRIBUIDOR API (Mock) ===
DISTRIBUTOR_API_KEY="test_api_key_64_chars_hex..."
DISTRIBUTOR_HMAC_SECRET="otro_secreto_para_firmar_requests"

# === SHALOM MOCK ===
SHALOM_API_KEY="mock_shalom_key"

# === SEGURIDAD ADICIONAL ===
ENCRYPTION_KEY_AES256="clave_de_32_bytes_para_cifrar_pii"