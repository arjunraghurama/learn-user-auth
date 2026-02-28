# Authentication Protocols Explained

When building secure applications, you will encounter various protocols designed to handle identity and access management. Our application uses **OpenID Connect**, but it's crucial to understand how it relates to other standards like **OAuth 2.0** and **SAML**.

Here is a breakdown of the three most common protocols.

---

## 1. OAuth 2.0 (Open Authorization)

**Purpose**: **Authorization** (Delegated Access).

OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts on an HTTP service. 

*   **Analogy**: It's like giving a valet key to a parking attendant. The attendant can drive and park your car, but the key doesn't allow them to open the trunk or glovebox.
*   **How it works**: When you use "Log in with Google" on a third-party site, OAuth 2.0 allows you to grant that site permission to view your basic profile or read your contacts *without* giving them your Google password.
*   **The Problem with Authentication**: OAuth 2.0 was designed *strictly* for authorization. It issues an **Access Token**, which grants permissions to APIs. It does *not* natively provide information about *who* the user is or how they authenticated. Developers historically hacked OAuth to use it for authentication, which led to significant security flaws.

---

## 2. OpenID Connect (OIDC)

**Purpose**: **Authentication** (Identity Verification) + Authorization.

Because OAuth 2.0 lacked a standard way to verify identity, OpenID Connect (OIDC) was built directly on top of the OAuth 2.0 framework as an identity layer.

*   **Analogy**: It's like receiving a modern driver's license alongside the valet key. The key (Access Token) lets you drive the car, and the license (ID Token) proves exactly who you are.
*   **How it works**: OIDC extends OAuth 2.0 by introducing a new token: the **ID Token**. This is a JSON Web Token (JWT) that contains claims (information) about the authenticated user (e.g., name, email, time of login).
*   **Why we use it**: Our Keycloak setup uses OIDC. When the React app requests access, it receives both an Access Token (to send to the FastAPI backend) and an ID Token (to display the user's `$preferred_username` in the UI).

---

## 3. SAML (Security Assertion Markup Language)

**Purpose**: **Authentication** and **Authorization** (Primarily Enterprise SSO).

Created in 2002, SAML is an older, XML-based open standard for exchanging authentication and authorization data between parties. It is heavily entrenched in enterprise software, corporate networks, and government systems.

*   **Analogy**: It's like showing a physical, notarized company ID badge to a security guard to access a building.
*   **How it works**: In SAML, the Identity Provider (e.g., Active Directory, Keycloak) authenticates the user and generates a heavy, XML-formatted "Assertion" proving the user's identity. This XML document is passed via the browser to the Service Provider (the application). 
*   **Comparison to OIDC**:
    *   **Format**: SAML uses XML, which is bulky and complex to parse in modern web apps and mobile apps. OIDC uses JSON, which is lightweight and native to JavaScript.
    *   **Use Cases**: SAML is largely considered legacy but is still dominant in massive enterprise environments for Single Sign-On (SSO) integrations like Workday, Salesforce, or corporate VPNs. OIDC is the modern standard for web browsers, mobile applications, and APIs.

## Summary Comparison

| Feature | OAuth 2.0 | OpenID Connect (OIDC) | SAML |
| :--- | :--- | :--- | :--- |
| **Primary Goal** | Authorization | Authentication + Authorization | Authentication + Authorization |
| **Data Format** | JSON (usually) | JWT (JSON Web Tokens) | XML |
| **Use Case** | API Access / Delegation | Modern Web/Mobile Apps | Enterprise SSO |
| **Key Artifacts** | Access Token | ID Token & Access Token | SAML Assertion |
| **Complexity** | Moderate | Moderate | High |
