# Use the official Nginx image
FROM nginx:alpine

# Install tini (optional but good for signal handling)
RUN apk add --no-cache tini

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy the project files into Nginx's html folder
COPY . /usr/share/nginx/html

# Replace default Nginx config to listen on port 3000
RUN sed -i 's/listen       80;/listen       3000;/g' /etc/nginx/conf.d/default.conf

# Expose port 3000 for the web server
EXPOSE 3000

# Start Nginx with tini to handle signals properly
CMD ["/sbin/tini", "--", "nginx", "-g", "daemon off;"]
