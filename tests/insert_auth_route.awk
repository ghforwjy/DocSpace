NR==422 {
    print "                location ~* /authentication {"
    print "                         proxy_pass http://$service_login;"
    print "                }"
    print ""
}
{print}
