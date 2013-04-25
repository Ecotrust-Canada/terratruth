<IfModule mod_ssl.c>
<VirtualHost *:443>
  ServerName amn-dev.ecotrust.ca

  DocumentRoot /usr/local/apps/terratruth/
  FastCGIExternalServer /usr/local/apps/terratruth/mysite.fcgi -host 127.0.0.1:3033

  RewriteEngine On

  RewriteRule ^/(media.*|webmap.*)$ /$1 [QSA,L,PT]
  RewriteCond %{REQUEST_URI} !/cgi.* 
  RewriteRule ^/(.*)$ /mysite.fcgi/$1 [QSA,L]

  #### Path Settings ####

  Alias /media-admin /usr/local/Django-1.1.1/django/contrib/admin/media

  <Location /media-admin>
    Order allow,deny
    Allow from all
  </Location>

  Alias /media /usr/local/apps/terratruth/media

  <Location /media>
    Order allow,deny
    Allow from all
  </Location>

  Alias /webmap /var/www/webmap

  <Location /webmap>
    Order allow,deny
    Allow from all
  </Location>

  #### CGI Settings ####

  ScriptAlias /cgi-bin /usr/lib/cgi-bin
  <Directory "/usr/lib/cgi-bin">
    AllowOverride None
    Options +ExecCGI -MultiViews +SymLinksIfOwnerMatch
    Order allow,deny
    Allow from all
    SSLOptions +StdEnvVars
  </Directory>
  
  #Only allow local access to private directory, controlling access
  #to mapserver and private mapfiles
  <Directory "/usr/lib/cgi-bin/private">
    AllowOverride None
    Options None
    Order deny,allow
    Deny from all
    Allow from 127.0.0.0/255.0.0.0 ::1/128
  </Directory>


  #### General Settings ####

  ServerAdmin webmaster@localhost

  ErrorLog /var/log/apache2/error.log
  LogLevel warn
  CustomLog /var/log/apache2/ssl_access.log combined
  
  #### SSL Settings ####

  SSLEngine on

  SSLCertificateFile    /etc/ssl/certs/SSLCert.pem
  SSLCertificateKeyFile /etc/ssl/certs/SSLCert.key

  <FilesMatch "\.(cgi|shtml|phtml|php)$">
	SSLOptions +StdEnvVars
  </FilesMatch>

  BrowserMatch ".*MSIE.*" \
	nokeepalive ssl-unclean-shutdown\
	downgrade-1.0 force-response-1.0

</VirtualHost>
</IfModule>

#### Setup port 80 (http) to simply forward amn-dev requests on to 443 (https)
<VirtualHost *:80>
  ServerName amn-dev.ecotrust.ca
  DocumentRoot /var/www/amn-dev.ecotrust.ca

  <Location "/">
    #Force django requests through SSL                                                              
    RewriteEngine On
    RewriteCond %{SERVER_PORT} !^443$
    RewriteRule ^.*$ https://%{SERVER_NAME}%{REQUEST_URI} [L,R]
  </Location>
  <Location "/cgi-bin/">
      SetHandler None
  </Location>
</VirtualHost>

#Required for some reason in order to serve up a rectified image via WMS
WSGIRestrictStdin Off
