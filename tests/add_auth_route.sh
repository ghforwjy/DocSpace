#!/bin/bash
# 在 authentication 路由之前添加新路由，将 /authentication 指向 service_login

sed -i 's|location ~\* /(authentication|modules|portal|security|settings|smtpsettings|capabilities|thirdparty|encryption|feed|migration) {|location ~* /authentication {\n                         proxy_pass http://$service_login;\n                }\n\n                location ~* /(authentication|modules|portal|security|settings|smtpsettings|capabilities|thirdparty|encryption|feed|migration) {|' /etc/nginx/conf.d/onlyoffice.conf
