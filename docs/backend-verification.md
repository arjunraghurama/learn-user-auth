# Backend Token Verification

This document explains in detail how the FastAPI backend (`backend/main.py`) securely validates the tokens issued by Keycloak. 

When the React frontend makes a request to our FastAPI backend (e.g., to create or get a Todo), it includes the Keycloak Access Token in the HTTP headers. It is the backend's responsibility to guarantee that this token is authentic, untampered, and valid.

---

## 1. Intercepting the Request

We use FastAPI's built-in `HTTPBearer` security scheme to intercept incoming requests and extract the token.

```python
security = HTTPBearer()

@app.get("/todos")
async def get_todos(user: dict = Depends(verify_token)): ...
```

By adding `Depends(verify_token)` to our API routes, FastAPI ensures that `verify_token` is executed *before* the route's main logic. If the token is invalid, the request is immediately rejected with a `401 Unauthorized` error.

## 2. The `verify_token` Anatomy

The `verify_token` function performs a series of cryptographic checks to ensure the token is legitimate. Here is the step-by-step breakdown:

### Step 1: Extract the Token
The raw JWT (JSON Web Token) string is extracted from the `Authorization: Bearer <token>` header provided by the frontend.

### Step 2: Fetch Public Keys (JWKS)
Keycloak signs its tokens using a private RSA key. To verify the signature, our backend needs Keycloak's corresponding **Public Key**.

The backend makes an asynchronous HTTP request to Keycloak's JWKS (JSON Web Key Set) endpoint:
```python
JWKS_URL = f"http://keycloak:8080/realms/myrealm/protocol/openid-connect/certs"

async def get_public_keys():
    # Fetches the public keys directly from Keycloak
```
*Note: In a production environment, you would cache these keys so you don't make an HTTP request to Keycloak for every single API request.*

### Step 3: Match the Key ID (`kid`)
Keycloak regularly rotates its cryptographic keys for security. The JWKS endpoint returns a *list* of valid public keys. How do we know which one was used to sign the token?

Tokens contain three parts: Header, Payload, and Signature. The backend parses the **Header** (without verifying the signature yet) to read the `kid` (Key ID) property.

```python
unverified_header = jwt.get_unverified_header(token)
```

It then scans the list of public keys retrieved from Keycloak to find the one with a matching `kid`.

### Step 4: Cryptographic Verification
Once the correct public key is found, the backend uses the `python-jose` library to cryptographically verify the token.

```python
payload = jwt.decode(
    token,
    rsa_key,
    algorithms=["RS256"],
    options={"verify_aud": False} 
)
```

This single `jwt.decode` function performs multiple crucial checks:
1.  **Signature Validity**: It mathematically proves that the token was signed by Keycloak's private key and hasn't been tampered with.
2.  **Expiration Check (`exp`)**: It ensures the token hasn't expired.
3.  **Algorithm Check**: It ensures the token was signed using the expected robust algorithm (`RS256`).

*(Note: We pass `{"verify_aud": False}` in this demo because standard Keycloak setups require specific client audience mappings that we bypassed for simplicity.)*

### Step 5: Returning the User Identity
If the `jwt.decode` function succeeds without throwing an error, the token is 100% valid.

The function returns the decoded **Payload**. This payload is a Python dictionary containing all the claims from the token, including the `sub` claim. 

The `sub` (Subject) claim contains the unique internal UUID of the user in Keycloak. We use this UUID in all our database queries to uniquely identify which Todos belong to which user.

```python
user_id = user.get("sub")
```
