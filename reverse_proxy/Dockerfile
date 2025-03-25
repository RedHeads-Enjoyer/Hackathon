FROM nginx:latest

# Копируем стандартный конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Стандартная команда запуска Nginx
CMD ["nginx", "-g", "daemon off;"]