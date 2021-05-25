FROM registry.access.redhat.com/ubi8/nginx-118

# Add application sources
#ADD test-app/nginx.conf "${NGINX_CONF_PATH}"
#ADD test-app/nginx-default-cfg/*.conf "${NGINX_DEFAULT_CONF_PATH}"
#ADD test-app/nginx-cfg/*.conf "${NGINX_CONFIGURATION_PATH}"
ADD dist/* .

EXPOSE 8080
EXPOSE 8443

# Run script uses standard ways to run the application
CMD nginx -g "daemon off;"
