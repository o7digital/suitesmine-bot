FROM botpress/server:latest

# expone el puerto en el que corre Botpress
EXPOSE 3000

# comando por defecto de la imagen (ya trae bp)
CMD ["./bp"]
