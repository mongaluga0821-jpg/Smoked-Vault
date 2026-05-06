# Use official Nginx image
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy all project files
COPY . .

# Remove default config and use template
RUN rm /etc/nginx/conf.d/default.conf
COPY default.conf.template /etc/nginx/conf.d/default.conf.template

# Install envsubst to replace PORT dynamically
RUN apk add --no-cache gettext

# Start Nginx using PORT environment variable
CMD envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;'
