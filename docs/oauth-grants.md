# OAuth 2.0 Grant Types

In OAuth 2.0, a "Grant" (often called a "Flow") is the specific sequence of steps used by an application to acquire an Access Token. Different types of applications (web apps, mobile apps, server-to-server) require different levels of security and user interaction, which is why multiple grant types exist.

Here are the most common OAuth 2.0 Grant Types, including the ones supported by Keycloak.

---

## 1. Authorization Code Grant

**Best for**: Web Applications, Single Page Applications (SPAs), and Mobile Apps.
**Security Level**: High (This is the flow used in our React application).

This is the most common and secure flow. It involves redirecting the user to the Authorization Server (Keycloak), where they log in. Instead of returning the token directly in the URL (which is insecure), the server returns a temporary **Authorization Code**. The application then makes a secure, backend (or AJAX) POST request to exchange this code for the actual Access Token.

**Key Characteristic**: The Access Token is never exposed in the browser's URL history.

---

## 2. Implicit Grant (Legacy)

**Best for**: Older Single Page Applications (SPAs).
**Security Level**: Low (No longer recommended).

Historically used by JavaScript applications that didn't have a backend. In this flow, the Access Token is returned *directly* in the URL redirect after the user logs in. 

**Why it's deprecated**: Because the token is in the URL hash fragment, it can be leaked via browser history, server logs, or referrer headers. Modern SPAs (like our React app) should use the **Authorization Code Grant with PKCE** instead.

---

## 3. Resource Owner Password Credentials Grant (Direct Access Grant)

**Best for**: Highly trusted first-party applications or legacy migrations.
**Security Level**: Low to Moderate.

In this flow, the application collects the user's actual username and password in its own custom form, and sends them directly to the Authorization Server to get a token.

**Drawbacks**:
* The application handles the password directly, violating the core principle of OAuth (which is to avoid sharing passwords with the app).
* It completely breaks Multi-Factor Authentication (MFA) and Single Sign-On (SSO).
* In Keycloak, this is referred to as **Direct Access Grants**. We enabled it for our client earlier, but it should generally be disabled in production unless absolutely necessary.

---

## 4. Client Credentials Grant

**Best for**: Machine-to-Machine (M2M) communication (e.g., microservices, cron jobs).
**Security Level**: High (Requires secure storage of secrets).

This flow does **not** involve a user. It is used when a backend service needs to authenticate itself to an API. The application uses its own `client_id` and `client_secret` to directly request an Access Token.

**Example**: If our FastAPI backend needed to independently talk to a generic Email API, it would use this grant type to authenticate itself.

---

## 5. Refresh Token Grant

**Best for**: All applications that receive a Refresh Token.
**Security Level**: High.

Access Tokens are intentionally short-lived (e.g., 5-15 minutes) to limit the damage if they are stolen. When an Access Token expires, the application can use the long-lived **Refresh Token** it received during the initial login to silently request a brand new Access Token without making the user log in again.

---

## Summary

| Grant Type / Flow | User Involvement | Token Delivery | Primary Use Case |
| :--- | :--- | :--- | :--- |
| **Authorization Code** | Yes | Backend Exchange | SPAs, Mobile, Web Apps |
| **Implicit** | Yes | URL Fragment | *Deprecated* |
| **Password (Direct Access)**| Yes | Backend Exchange | Legacy / Highly Trusted Apps |
| **Client Credentials** | No | Backend Exchange | Machine-to-Machine (M2M) |
| **Refresh Token** | No | Backend Exchange | Renewing Access Tokens |
