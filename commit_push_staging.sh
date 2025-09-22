#!/bin/bash

# Mostrar el estado del repo
git status

# Pedir comentario de commit
read -p "📝 Escribe el comentario del commit: " COMMIT_MSG

# Validar que no esté vacío
if [[ -z "$COMMIT_MSG" ]]; then
  echo "❌ El mensaje no puede estar vacío. Abortando."
  exit 1
fi

# Añadir cambios, hacer commit y push
git add .
git commit -m "$COMMIT_MSG"
git push origin staging
