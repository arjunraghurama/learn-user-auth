FROM nginx:alpine

# Install openssl to generate self-signed certs
RUN apk add --no-cache openssl

# Generate self-signed certs
RUN mkdir -p /etc/nginx/ssl
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/nginx.key \
    -out /etc/nginx/ssl/nginx.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Copy the custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose HTTPS port
EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]
