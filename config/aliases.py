"""Documented alias registry for vendor and product normalisation.
Maps common variations, abbreviations, casing, and punctuation to canonical names.
"""

# Canonical product aliases mapping: normalized alias -> canonical product name
PRODUCT_ALIASES: dict[str, str] = {
    # Core Banking Framework
    "core banking": "Core Banking Framework",
    "core banking framework": "Core Banking Framework",
    "core-banking": "Core Banking Framework",
    "core-banking-framework": "Core Banking Framework",
    "corebanking": "Core Banking Framework",
    "corebankingframework": "Core Banking Framework",
    "cbf": "Core Banking Framework",

    # Identity Provider SaaS
    "identity provider": "Identity Provider SaaS",
    "identity provider saas": "Identity Provider SaaS",
    "identity-provider": "Identity Provider SaaS",
    "identity-provider-saas": "Identity Provider SaaS",
    "idp": "Identity Provider SaaS",
    "idp saas": "Identity Provider SaaS",
    "idp-saas": "Identity Provider SaaS",
    "identity saas": "Identity Provider SaaS",

    # Cloud Database Engine
    "cloud database": "Cloud Database Engine",
    "cloud database engine": "Cloud Database Engine",
    "cloud-database": "Cloud Database Engine",
    "cloud-database-engine": "Cloud Database Engine",
    "clouddb": "Cloud Database Engine",
    "cloud db": "Cloud Database Engine",
    "cloud-db": "Cloud Database Engine",

    # Web Application Firewall
    "web application firewall": "Web Application Firewall",
    "web-application-firewall": "Web Application Firewall",
    "waf": "Web Application Firewall",
    "cloud waf": "Web Application Firewall",
    "app firewall": "Web Application Firewall",

    # Embedded IoT Gateway
    "embedded iot gateway": "Embedded IoT Gateway",
    "embedded-iot-gateway": "Embedded IoT Gateway",
    "iot gateway": "Embedded IoT Gateway",
    "iot-gateway": "Embedded IoT Gateway",
    "embedded gateway": "Embedded IoT Gateway",

    # Enterprise Router OS
    "enterprise router os": "Enterprise Router OS",
    "enterprise-router-os": "Enterprise Router OS",
    "enterprise router": "Enterprise Router OS",
    "router os": "Enterprise Router OS",
    "routeros": "Enterprise Router OS",
    "router-os": "Enterprise Router OS",

    # Standard third-party software aliases (for future or custom profiles)
    "apache": "Apache HTTP Server",
    "apache http server": "Apache HTTP Server",
    "apache httpserver": "Apache HTTP Server",
    "http_server": "Apache HTTP Server",
    "httpd": "Apache HTTP Server",
    "nginx": "NGINX Web Server",
    "nginx web server": "NGINX Web Server",
    "postgres": "PostgreSQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL Server",
    "redis": "Redis In-Memory Database",
}

# Vendor aliases
VENDOR_ALIASES: dict[str, str] = {
    "apache": "Apache Software Foundation",
    "apache software foundation": "Apache Software Foundation",
    "cisco": "Cisco Systems",
    "cisco systems": "Cisco Systems",
    "microsoft": "Microsoft Corporation",
    "oracle": "Oracle Corporation",
}
