FROM mongo:latest
# Copia os ficheiros para dentro da imagem durante o build
COPY db.json /docker-entrypoint-initdb.d/
COPY mongo-init/import.sh /docker-entrypoint-initdb.d/