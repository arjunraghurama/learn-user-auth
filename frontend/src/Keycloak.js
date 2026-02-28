import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
    url: "https://localhost/auth",
    realm: "myrealm",
    clientId: "react-client",
});

export default keycloak;
