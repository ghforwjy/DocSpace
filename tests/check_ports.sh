for p in 5011 5000 80 3000; do
    timeout 1 sh -c "echo -n '$p: ' && (echo >/dev/tcp/127.0.0.1/$p) 2>/dev/null && echo 'OPEN' || echo 'CLOSED'"
done
