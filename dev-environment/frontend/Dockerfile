# ============================================================
# STAGE 1: Desarrollo (Hot Reload)
# ============================================================
FROM node:22-alpine AS development

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Exponer puerto de Vite
EXPOSE 5173

# Comando de desarrollo con hot reload
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============================================================
# STAGE 2: Build de producción
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# STAGE 3: Servir con Nginx (Producción)
# ============================================================
FROM nginx:alpine AS production

# Copiar build de React
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración de Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
