# Use official PHP image with Apache
FROM php:8.3-apache

# Install PostgreSQL PDO extension and other dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy server files
COPY server/ /var/www/html/

# Create uploads directory
RUN mkdir -p /tmp/uploads && chmod 777 /tmp/uploads

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Expose port (Render will set PORT env variable)
EXPOSE ${PORT:-80}

# Start Apache in foreground
CMD ["apache2-foreground"]
