openssl req -new -key cert.key -subj "//CN=$1" -sha256 | openssl x509 -req -days 3650 -CA ca.crt -CAkey ca.key -set_serial "$2"
