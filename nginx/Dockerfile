FROM nginx:latest

# Устанавливаем envsubst для подстановки переменных
RUN apt-get update && \
    apt-get install -y gettext-base && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Копируем шаблон конфига в специальную директорию
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Стандартная команда запуска Nginx
CMD ["nginx", "-g", "daemon off;"]