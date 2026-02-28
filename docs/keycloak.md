# Introduction to Keycloak

**Keycloak** is an open-source Identity and Access Management (IAM) solution. Instead of writing custom authentication and authorization code for every application you build, you can offload this responsibility entirely to Keycloak. 

It acts as a centralized authentication server. When a user tries to access your application (like our React frontend), the application redirects them to Keycloak to log in. Once authenticated, Keycloak issues a token (like a JWT) and redirects the user back to your application. Your backend services then verify these tokens to grant access to protected resources.

## Core Concepts

To understand how Keycloak organizes and manages identities, you need to understand its core hierarchical concepts.

### 1. Realms

A **Realm** is the highest-level concept in Keycloak. You can think of a realm as an isolated tenant or a distinct workspace. 

*   **Isolation:** Everything inside a realm (users, roles, applications, integrations) is completely isolated from other realms. A user created in `Realm A` cannot automatically log into an application configured in `Realm B`.
*   **The Master Realm:** When you first install Keycloak, it comes with a built-in `master` realm. The `master` realm is special; it is used exclusively to manage Keycloak itself (e.g., creating other realms, configuring the server). You should **never** use the `master` realm to manage users for your own applications.
*   **Custom Realms:** For your applications, you create a new realm (e.g., our `myrealm`). This is where you configure the specific login settings, identity providers, and user pools for your project.

### 2. Clients

In Keycloak terminology, a **Client** represents an application that requests authentication. 

If you have a React frontend, a mobile app, and a backend API, each of these would be configured as a separate "Client" within your realm. 

When configuring a client, you define:
*   **Client ID:** A unique identifier (e.g., `react-client`).
*   **Valid Redirect URIs:** The URLs Keycloak is allowed to redirect users back to after a successful login (crucial for security so attackers can't steal authorization codes).
*   **Web Origins:** Allowed CORS origins for the application.
*   **Client Type:** Whether the client is "Public" (like a React SPA where secrets cannot be hidden) or "Confidential" (like a Node.js web server that can securely store a client secret).

### 3. Users

Users are the actual human identities or service accounts that log in to your system. They belong to a specific realm. Users define attributes like usernames, passwords (credentials), emails, and whether their account is enabled or requires email verification.

### 4. Roles

**Roles** define *what* a user is allowed to do. 

Instead of hardcoding permissions to specific users, you assign permissions to roles (e.g., `admin`, `editor`, `viewer`), and then you assign those roles to users. 

Keycloak supports two levels of roles:
*   **Realm Roles:** Global roles that apply across the entire realm (e.g., a global `super-admin`).
*   **Client Roles:** Roles specific to a single application (e.g., a `moderator` role that only applies to a specific forum client, not the whole company).

## Summary of the Flow

1. You create a custom **Realm**.
2. Inside that Realm, you register your application as a **Client**.
3. **Users** are created within the Realm.
4. When a User tries to access your Client, the Client directs them to the Realm's login page.
5. Upon success, Keycloak issues tokens that the Client uses to prove the User's identity and **Roles**.
